import { RoomStateSystem } from '@/systems/roomState/RoomStateSystem';
import { TaskSystem } from '@/systems/tasks/TaskSystem';
 
type EconomyMemory = {
    tick: number;
    stage: string;
    pauseUpgrading: boolean;
    energyRatio: number;
    storedEnergy: number;
    terminalEnergy: number;
    buildUrgent: boolean;
    repairUrgent: boolean;
};
 
function getStage(rcl: number): string {
    if (rcl <= 2) return 'bootstrap';
    if (rcl <= 4) return 'early';
    if (rcl <= 6) return 'mid';
    if (rcl <= 8) return 'late';
    return 'post';
}
 
function ensureEconomy(roomName: string): EconomyMemory {
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
    const r: any = Memory.rooms[roomName];
    if (!r.economy) r.economy = {};
    return r.economy as EconomyMemory;
}
 
export const EconomySystem = {
    run(): void {
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
 
            const state = RoomStateSystem.get(roomName);
            if (!state) continue;
 
            const energyRatio = state.energyCapacity > 0 ? state.energyAvailable / state.energyCapacity : 1;
            const storedEnergy = state.storedEnergy || 0;
            const terminalEnergy = state.terminalEnergy || 0;
 
            const hasFill = TaskSystem.list(roomName).some(t => t && t.type === 'fillExtension');
            const hasTowerFill = TaskSystem.list(roomName).some(t => t && t.type === 'fillTower');
 
            const downgradeUrgent = state.downgradeTicks !== undefined && state.downgradeTicks < 10000;
 
            let pauseUpgrading = false;
            if (!downgradeUrgent) {
                if (hasFill || hasTowerFill) pauseUpgrading = true;
                if (energyRatio <= 0.3) pauseUpgrading = true;
                if (room.storage && storedEnergy <= 5000) pauseUpgrading = true;
            }
 
            const buildUrgent = state.constructionSites > 0 && energyRatio >= 0.4;
            const repairUrgent = state.criticalRepairTargets > 0 && (storedEnergy > 10000 || energyRatio >= 0.6);
 
            const econ = ensureEconomy(roomName);
            Object.assign(econ, {
                tick: Game.time,
                stage: getStage(state.rcl),
                pauseUpgrading,
                energyRatio,
                storedEnergy,
                terminalEnergy,
                buildUrgent,
                repairUrgent
            });
        }
    }
};

