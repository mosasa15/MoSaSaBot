import { IntelSystem } from '@/systems/intel/IntelSystem';
 
export type RoomState = {
    tick: number;
    roomName: string;
    rcl: number;
    energyAvailable: number;
    energyCapacity: number;
    storedEnergy: number;
    terminalEnergy: number;
    constructionSites: number;
    repairTargets: number;
    criticalRepairTargets: number;
    downgradeTicks?: number;
    hostileThreat: number;
};
 
function ensureRoomState(roomName: string): any {
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
    if (!Memory.rooms[roomName].state) Memory.rooms[roomName].state = {};
    return Memory.rooms[roomName].state;
}
 
function countRepairs(room: Room): { repairTargets: number; criticalRepairTargets: number } {
    const structures = room.find(FIND_STRUCTURES);
    let repairTargets = 0;
    let critical = 0;
 
    for (const s of structures) {
        if (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) continue;
        if ((s as any).hits === undefined || (s as any).hitsMax === undefined) continue;
        const hits = (s as any).hits as number;
        const hitsMax = (s as any).hitsMax as number;
        if (hits >= hitsMax) continue;
        repairTargets++;
        if (hits < hitsMax * 0.2) critical++;
    }
 
    return { repairTargets, criticalRepairTargets: critical };
}
 
export const RoomStateSystem = {
    run(): void {
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
 
            const storedEnergy = room.storage ? (room.storage.store[RESOURCE_ENERGY] || 0) : 0;
            const terminalEnergy = room.terminal ? (room.terminal.store[RESOURCE_ENERGY] || 0) : 0;
            const sites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
            const repairs = countRepairs(room);
 
            const intel = IntelSystem.get(roomName) as any;
            const hostileThreat =
                intel && intel.hostiles && typeof intel.hostiles.threat === 'number' ? intel.hostiles.threat : 0;
 
            const state: RoomState = {
                tick: Game.time,
                roomName,
                rcl: room.controller.level,
                energyAvailable: room.energyAvailable,
                energyCapacity: room.energyCapacityAvailable,
                storedEnergy,
                terminalEnergy,
                constructionSites: sites,
                repairTargets: repairs.repairTargets,
                criticalRepairTargets: repairs.criticalRepairTargets,
                downgradeTicks: room.controller.ticksToDowngrade,
                hostileThreat
            };
 
            const memState = ensureRoomState(roomName);
            Object.assign(memState, state);
        }
    },
 
    get(roomName: string): RoomState | undefined {
        const r: any = Memory.rooms && Memory.rooms[roomName] ? (Memory.rooms[roomName] as any) : undefined;
        return r && r.state ? (r.state as RoomState) : undefined;
    }
};

