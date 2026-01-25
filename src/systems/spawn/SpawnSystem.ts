import { ROLE_CONFIGS } from '@/managers/structures/spawnLogic/spawnConfig';
import { RoomStateSystem } from '@/systems/roomState/RoomStateSystem';
 
export type SpawnRequest = {
    role: string;
    priority: number;
    valid: boolean;
    body: BodyPartConstant[];
    workLoc?: number;
    [key: string]: any;
};
 
function calculateCost(body: BodyPartConstant[]): number {
    return body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
}
 
function ensureCreepCounts(): void {
    if (global.creepNumCheckLastTime && global.creepNumCheckLastTime === Game.time) return;
 
    global.creepNum = {};
    global.creepNumCheckLastTime = Game.time;
 
    if (!Memory.rooms) Memory.rooms = {};
    for (const roomName in Memory.rooms) {
        if (!global.creepNum[roomName]) {
            global.creepNum[roomName] = {};
            for (const role in ROLE_CONFIGS) global.creepNum[roomName][role] = 0;
        }
    }
 
    for (const creepName in Game.creeps) {
        const creep = Game.creeps[creepName];
        if (!creep || !creep.memory) continue;
        const role = creep.memory.role;
        let home = creep.memory.home;
        if (!home) home = creep.memory.sourceRoomName || creep.memory.targetRoomName;
        if (!role || !home) continue;
        if (!creep.memory.home) creep.memory.home = home;
 
        if (!global.creepNum[home]) {
            global.creepNum[home] = {};
            for (const r in ROLE_CONFIGS) global.creepNum[home][r] = 0;
        }
        global.creepNum[home][role] = (global.creepNum[home][role] || 0) + 1;
    }
}
 
function getQueuedCount(room: Room, role: string): number {
    const q = (Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].spawnQueue) ? Memory.rooms[room.name].spawnQueue : [];
    return q.filter(t => t && t.role === role).length;
}
 
function getQueuedSpawnableCount(room: Room, role: string): number {
    const q = (Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].spawnQueue) ? Memory.rooms[room.name].spawnQueue : [];
    return q.filter((t: any) => {
        if (!t || t.role !== role) return false;
        if (!t.body || t.body.length === 0) return false;
        const cost = typeof t.cost === 'number' ? t.cost : calculateCost(t.body);
        return cost > 0 && cost <= room.energyAvailable;
    }).length;
}
 
function getBodyForRoom(room: Room, role: string): BodyPartConstant[] {
    const config: any = (ROLE_CONFIGS as any)[role];
    if (!config) return [WORK, CARRY, MOVE];
 
    const cap = room.energyCapacityAvailable || room.energyAvailable || 300;
    const tier =
        cap >= 3300 ? 8 :
        cap >= 2800 ? 7 :
        cap >= 2300 ? 6 :
        cap >= 1800 ? 5 :
        cap >= 1300 ? 4 :
        cap >= 800 ? 3 :
        cap >= 550 ? 2 : 1;
 
    for (let t = tier; t >= 1; t--) {
        const bodyConfig = config.body && (config.body as any)[t];
        if (!bodyConfig || bodyConfig.length === 0) continue;
        if (calculateCost(bodyConfig) <= cap) return bodyConfig as BodyPartConstant[];
    }
 
    const fallback = config.body && ((config.body as any)[1] || (config.body as any)[room.controller.level]);
    return (fallback as BodyPartConstant[]) || [WORK, CARRY, MOVE];
}
 
function getAffordableBody(role: string, energyAvailable: number, room: Room): BodyPartConstant[] {
    if (role === 'harvester') {
        const harvesterCount = room ? ((global.creepNum[room.name]?.harvester || 0) as number) : 0;
        if (harvesterCount > 0 && energyAvailable < 300) return [];
 
        const maxEnergy = energyAvailable;
        let workParts = Math.floor((maxEnergy - 100) / 100);
        if (workParts > 5) workParts = 5;
        if (workParts < 1) return [WORK, CARRY, MOVE];
 
        const body: BodyPartConstant[] = [];
        for (let i = 0; i < workParts; i++) body.push(WORK);
        body.push(CARRY);
        body.push(MOVE);
        return body;
    }
 
    const pattern: BodyPartConstant[] =
        role === 'manager' || role === 'transferer' || role === 'centralTransferer' || role === 'thinker'
            ? [CARRY, MOVE]
            : [WORK, CARRY, MOVE];
 
    const baseCost = calculateCost(pattern);
    if (energyAvailable < baseCost) return [];
 
    const body: BodyPartConstant[] = [];
    const maxParts = 50;
    while (body.length + pattern.length <= maxParts && calculateCost(body.concat(pattern)) <= energyAvailable) {
        body.push(...pattern);
    }
    return body.length > 0 ? body : pattern;
}
 
export const SpawnSystem = {
    generate(room: Room): SpawnRequest[] {
        ensureCreepCounts();
        const tasks: SpawnRequest[] = [];
 
        const roomCounts = global.creepNum[room.name] || {};
        const state = RoomStateSystem.get(room.name);
 
        const harvesterEmergency = (roomCounts.harvester || 0) + getQueuedSpawnableCount(room, 'harvester');
        if (harvesterEmergency === 0 && room.energyAvailable >= 200) {
            const body = getAffordableBody('harvester', room.energyAvailable, room);
            if (body.length > 0) tasks.push({ role: 'harvester', priority: 100, valid: true, body });
        }
 
        const upgraderEmergency = (roomCounts.upgrader || 0) + getQueuedSpawnableCount(room, 'upgrader');
        if (upgraderEmergency === 0 && room.controller && room.controller.my && room.controller.level < 8 && room.energyAvailable >= 200) {
            const body = getAffordableBody('upgrader', room.energyAvailable, room);
            if (body.length > 0) tasks.push({ role: 'upgrader', priority: 90, valid: true, body });
        }
 
        const hostileThreat = state ? state.hostileThreat : 0;
        if (hostileThreat > 0.5) {
            const defenderConfig: any = (ROLE_CONFIGS as any).defender;
            const limit = defenderConfig && typeof defenderConfig.limit === 'function' ? defenderConfig.limit(room) : (defenderConfig ? defenderConfig.limit : 0);
            const count = (roomCounts.defender || 0) + getQueuedCount(room, 'defender');
            if (limit && count < limit) {
                tasks.push({
                    role: 'defender',
                    priority: Math.max(95, defenderConfig ? defenderConfig.priority : 95),
                    valid: true,
                    body: getBodyForRoom(room, 'defender')
                });
            }
        }
 
        for (const [role, config] of Object.entries(ROLE_CONFIGS as any)) {
            const currentLimit = typeof (config as any).limit === 'function' ? (config as any).limit(room) : (config as any).limit;
            const count = (roomCounts[role] || 0) + getQueuedCount(room, role);
            if ((config as any).condition(room) && count < currentLimit) {
                let priority = (config as any).priority as number;
 
                if (state && state.downgradeTicks !== undefined && role === 'upgrader') {
                    if (state.downgradeTicks < 8000) priority += 20;
                    else if (state.downgradeTicks < 15000) priority += 10;
                }
                if (state && state.constructionSites > 0 && role === 'builder') priority += Math.min(15, state.constructionSites);
                const econ = Memory.rooms && Memory.rooms[room.name] ? (Memory.rooms[room.name] as any).economy : undefined;
                if (econ && econ.pauseUpgrading === true && role === 'upgrader') priority -= 30;
                if (priority < 1) priority = 1;
 
                tasks.push({
                    role,
                    priority,
                    valid: true,
                    body: getBodyForRoom(room, role)
                });
            }
        }
 
        return tasks.filter(t => t.valid).sort((a, b) => b.priority - a.priority);
    }
};
