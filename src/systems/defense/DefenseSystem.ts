import { RoomStateSystem } from '@/systems/roomState/RoomStateSystem';
 
type DefenseMemory = {
    tick: number;
    threat: number;
    wallTargetHits: number;
};
 
function ensureDefense(roomName: string): DefenseMemory {
    if (!Memory.rooms) Memory.rooms = {};
    if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
    const r: any = Memory.rooms[roomName];
    if (!r.defense) r.defense = {};
    return r.defense as DefenseMemory;
}
 
function getWallTargetHits(rcl: number): number {
    if (rcl <= 3) return 5000;
    if (rcl === 4) return 50000;
    if (rcl === 5) return 250000;
    if (rcl === 6) return 1000000;
    if (rcl === 7) return 3000000;
    return 50000000;
}
 
function shouldActivateSafeMode(room: Room, threat: number): boolean {
    if (!room.controller || !room.controller.my) return false;
    if (room.controller.safeMode) return false;
    if (!room.controller.safeModeAvailable || room.controller.safeModeAvailable <= 0) return false;
    if (threat < 40) return false;
 
    const spawns = room.find(FIND_MY_SPAWNS);
    const anchor = spawns[0] || room.storage;
    if (!anchor) return threat >= 80;
 
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    return hostiles.some(c => c.pos.inRangeTo(anchor.pos, 6));
}
 
export const DefenseSystem = {
    run(): void {
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
 
            const state = RoomStateSystem.get(roomName);
            const threat = state ? state.hostileThreat : 0;
            const wallTargetHits = getWallTargetHits(room.controller.level);
 
            const mem = ensureDefense(roomName);
            mem.tick = Game.time;
            mem.threat = threat;
            mem.wallTargetHits = wallTargetHits;
 
            if (threat > 0 && shouldActivateSafeMode(room, threat)) {
                room.controller.activateSafeMode();
            }
        }
    }
};

