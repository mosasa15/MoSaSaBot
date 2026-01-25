export class SourceManager {
    public static run(room: Room): void {
        const r = room as any;
        const sources = r.source || room.find(FIND_SOURCES);
        
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].spawnQueue) Memory.rooms[room.name].spawnQueue = [];
        if (!Memory.rooms[room.name].sourceStations) Memory.rooms[room.name].sourceStations = {};

        const miners = room.find(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'harvester' && typeof c.memory.workLoc === 'number'
        });
        const minersByLoc: Record<number, Creep[]> = {};
        for (const m of miners) {
            const loc = m.memory.workLoc as number;
            if (!minersByLoc[loc]) minersByLoc[loc] = [];
            minersByLoc[loc].push(m);
        }
        for (const locKey in minersByLoc) {
            const k = Number(locKey);
            minersByLoc[k].sort((a, b) => (b.ticksToLive || 0) - (a.ticksToLive || 0));
        }

        sources.forEach((source: Source, index: number) => {
            const list = minersByLoc[index] || [];
            const miner = list.length > 0 ? list[0] : null;
            const station = Memory.rooms[room.name].sourceStations[index] || (Memory.rooms[room.name].sourceStations[index] = {});
            const pathTime = typeof station.pathTime === 'number' ? station.pathTime : 30;
            const spawnTime = miner ? miner.body.length * 3 : 60;
            const buffer = 20;
            const needReplace = !miner || (miner.ticksToLive !== undefined && miner.ticksToLive <= pathTime + spawnTime + buffer);
            if (needReplace) this.requestMiner(room, index);
        });
    }

    private static requestMiner(room: Room, workLoc: number): void {
        const queue = Memory.rooms[room.name].spawnQueue;
        const inQueue = queue.some((t: any) => t.role === 'harvester' && t.workLoc === workLoc);
        
        if (!inQueue) {
             queue.push({
                 role: 'harvester',
                 priority: 100,
                 valid: true,
                 body: null,
                 workLoc: workLoc
             });
             // console.log(`[SourceManager] Requested miner for source ${workLoc} in ${room.name}`);
        }
    }
}
