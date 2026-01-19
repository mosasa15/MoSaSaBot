export class CreepDemandManager {
    public static run(room: Room): void {
        this.manageUpgraders(room);
        this.manageBuilders(room);
        this.manageLogistics(room);
        this.manageDefense(room);
    }

    private static manageDefense(room: Room): void {
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
             const defenders = room.find(FIND_MY_CREEPS, { filter: c => c.memory.role === 'defender' });
             if (defenders.length < hostiles.length) {
                 this.requestCreep(room, 'defender', 200); 
             }
        }
    }

    private static manageUpgraders(room: Room): void {
        const upgraders = room.find(FIND_MY_CREEPS, { filter: c => c.memory.role === 'upgrader' });
        // Logic: 1 upgrader usually. If storage full, maybe more.
        const limit = 1;
        if (upgraders.length < limit) {
            this.requestCreep(room, 'upgrader', 50);
        }
    }

    private static manageBuilders(room: Room): void {
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
        if (sites.length === 0) return;

        const builders = room.find(FIND_MY_CREEPS, { filter: c => c.memory.role === 'builder' });
        const limit = Math.min(3, Math.ceil(sites.length / 5));
        
        if (builders.length < limit) {
             this.requestCreep(room, 'builder', 60);
        }
    }

    private static manageLogistics(room: Room): void {
        const managers = room.find(FIND_MY_CREEPS, { filter: c => c.memory.role === 'manager' });
        const limit = 1; // Keep it simple
        if (managers.length < limit) {
             this.requestCreep(room, 'manager', 80);
        }
    }

    private static requestCreep(room: Room, role: string, priority: number): void {
        if (!Memory.rooms[room.name]) return;
        const queue = Memory.rooms[room.name].spawnQueue || [];
        if (!queue.some((t: any) => t.role === role)) {
             queue.push({
                 role: role,
                 priority: priority,
                 valid: true,
                 body: null,
                 workLoc: 0
             });
             Memory.rooms[room.name].spawnQueue = queue;
        }
    }
}
