export class SourceManager {
    public static run(room: Room): void {
        const r = room as any;
        const sources = r.source || room.find(FIND_SOURCES);
        
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].spawnQueue) Memory.rooms[room.name].spawnQueue = [];

        sources.forEach((source: Source, index: number) => {
             const miners = room.find(FIND_MY_CREEPS, {
                 filter: c => c.memory.role === 'harvester' && c.memory.workLoc === index
             });
             
             const minerDying = miners.length > 0 && miners[0].ticksToLive && miners[0].ticksToLive < 100;

             if (miners.length === 0 || minerDying) {
                 this.requestMiner(room, index);
             }
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
