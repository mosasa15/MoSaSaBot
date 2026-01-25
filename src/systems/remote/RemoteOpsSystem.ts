export const RemoteOpsSystem = {
    run(): void {
        if (Memory.settings && Memory.settings.systems && Memory.settings.systems.remoteOps === false) return;
        for (const roomName of Object.keys(Game.rooms)) {
            const room = Game.rooms[roomName];
            if (!room || !room.controller || !room.controller.my) continue;
            if (room.controller.level < 2) continue;
 
            if (Game.time % 100 === 0) this.requestScouting(room);
            if (Game.time % 200 === 0) this.planRemoteMining(room);
        }
    },
 
    requestScouting(room: Room): void {
        const exits = Game.map.describeExits(room.name);
        if (!exits) return;
        if (!room.memory.remoteTasks) room.memory.remoteTasks = {};
 
        for (const dir of Object.keys(exits)) {
            const targetRoom = (exits as any)[dir] as string;
            const mem = Memory.rooms && Memory.rooms[targetRoom] ? Memory.rooms[targetRoom] : undefined;
            const stale = !mem || !mem.scouted || !mem.scoutTime || Game.time - mem.scoutTime > 2500;
            if (!stale) continue;
 
            const taskKey = `scout_${targetRoom}`;
            if (!room.memory.remoteTasks[taskKey]) {
                room.memory.remoteTasks[taskKey] = {
                    type: 'scout',
                    targetRoom,
                    priority: 5
                };
            }
        }
    },
 
    planRemoteMining(room: Room): void {
        const exits = Game.map.describeExits(room.name);
        if (!exits) return;
        if (!room.memory.remoteTasks) room.memory.remoteTasks = {};
 
        for (const dir of Object.keys(exits)) {
            const targetRoom = (exits as any)[dir] as string;
            const mem = Memory.rooms && Memory.rooms[targetRoom] ? (Memory.rooms[targetRoom] as any) : undefined;
            if (!mem || !mem.scouted || !mem.isSafe) continue;
            if (mem.owner) continue;
 
            const sources = Array.isArray(mem.sources) ? mem.sources : [];
            if (sources.length < 2) continue;
 
            for (let i = 0; i < sources.length; i++) {
                const s = sources[i];
                if (!s || !s.id) continue;
 
                const taskKey = `remote_harvest_${targetRoom}_${i}`;
                const existing = Object.values(Game.creeps).some((c: any) => c && c.memory && c.memory.role === 'remoteHarvester' && c.memory.taskID === taskKey);
                if (existing) continue;
 
                if (!room.memory.remoteTasks[taskKey]) {
                    room.memory.remoteTasks[taskKey] = {
                        type: 'remoteHarvester',
                        targetRoom,
                        sourceId: s.id,
                        sourceIndex: i,
                        priority: 4
                    };
                }
            }
        }
    }
};
