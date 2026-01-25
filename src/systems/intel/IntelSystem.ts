type RoomIntel = {
    roomName: string;
    lastSeen: number;
    controller?: {
        level?: number;
        owner?: string;
        reservedBy?: string;
        reservationTicks?: number;
        safeModeUntil?: number;
    };
    sources?: { id: Id<Source> }[];
    mineral?: { id: Id<Mineral>; type: MineralConstant };
    hostiles?: {
        count: number;
        threat: number;
        lastSeen: number;
    };
};
 
function ensureIntelRoot(): Record<string, RoomIntel> {
    if (!Memory.intel) Memory.intel = {};
    return Memory.intel as any;
}
 
function scoreHostileThreat(room: Room): number {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length === 0) return 0;
 
    let score = 0;
    for (const c of hostiles) {
        const body = c.body || [];
        for (const part of body) {
            const type = part.type;
            if (type === HEAL) score += part.boost ? 12 : 6;
            else if (type === ATTACK) score += part.boost ? 8 : 4;
            else if (type === RANGED_ATTACK) score += part.boost ? 10 : 5;
            else if (type === WORK) score += 1;
            else if (type === TOUGH) score += part.boost ? 2 : 0.5;
        }
    }
    return score;
}
 
export const IntelSystem = {
    run(): void {
        const root = ensureIntelRoot();
 
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room) continue;
 
            const intel: RoomIntel = root[roomName] || {
                roomName,
                lastSeen: Game.time
            };
 
            intel.roomName = roomName;
            intel.lastSeen = Game.time;
 
            if (room.controller) {
                intel.controller = intel.controller || {};
                intel.controller.level = room.controller.level;
                intel.controller.owner = room.controller.owner ? room.controller.owner.username : undefined;
                intel.controller.reservedBy = room.controller.reservation ? room.controller.reservation.username : undefined;
                intel.controller.reservationTicks = room.controller.reservation ? room.controller.reservation.ticksToEnd : undefined;
                intel.controller.safeModeUntil = room.controller.safeMode ? Game.time + room.controller.safeMode : undefined;
            }
 
            const sources = room.find(FIND_SOURCES);
            intel.sources = sources.map(s => ({ id: s.id }));
 
            const minerals = room.find(FIND_MINERALS);
            const m = minerals[0];
            if (m) intel.mineral = { id: m.id, type: m.mineralType };
 
            const threat = scoreHostileThreat(room);
            if (threat > 0) {
                intel.hostiles = {
                    count: room.find(FIND_HOSTILE_CREEPS).length,
                    threat,
                    lastSeen: Game.time
                };
            } else if (intel.hostiles) {
                const age = Game.time - intel.hostiles.lastSeen;
                const decay = age > 0 ? Math.max(0, 1 - age / 500) : 1;
                intel.hostiles.threat = intel.hostiles.threat * decay;
                intel.hostiles.count = 0;
                if (intel.hostiles.threat < 0.5) delete intel.hostiles;
            }
 
            root[roomName] = intel;
        }
    },
 
    get(roomName: string): RoomIntel | undefined {
        const root = ensureIntelRoot();
        return root[roomName];
    }
};

