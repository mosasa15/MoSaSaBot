// @ts-nocheck
const StrategyRemoteMining = {
    run: function(room) {
        // Only run for rooms RCL >= 2
        if (room.controller.level < 2) return;
        
        // Run every 100 ticks to save CPU
        if (Game.time % 100 !== 0) return;

        const neighbors = Game.map.describeExits(room.name);
        if (!neighbors) return;

        // 1. Check neighbors and request scouting
        for (const direction in neighbors) {
            const neighborName = neighbors[direction];
            const memory = Memory.rooms[neighborName];

            // If never scouted or scout info is old (> 3000 ticks), request scout
            if (!memory || !memory.scouted || (Game.time - memory.scoutTime > 3000)) {
                this.requestScout(room, neighborName);
            }
            
            // 2. Evaluate for Mining
            if (memory && memory.scouted && memory.isSafe) {
                // User Requirement: Prefer 2 sources
                if (memory.sources && memory.sources.length >= 2) {
                    // This room is a candidate!
                    this.setupRemoteMining(room, neighborName, memory.sources);
                }
            }
        }
    },

    requestScout: function(room, targetRoomName) {
        // Flag for spawnConfig to see
        if (!room.memory.remoteTasks) room.memory.remoteTasks = {};
        
        // Check if we already have a scout for this room
        const existingScout = _.filter(Game.creeps, c => 
            c.memory.role === 'scout' && c.memory.targetRoom === targetRoomName
        )[0];

        if (!existingScout) {
            room.memory.remoteTasks[`scout_${targetRoomName}`] = {
                type: 'scout',
                targetRoom: targetRoomName,
                priority: 5 // Low priority
            };
        }
    },

    setupRemoteMining: function(room, targetRoomName, sources) {
        if (!room.memory.remoteTasks) room.memory.remoteTasks = {};

        // For each source in the remote room, request a remote harvester
        sources.forEach((source, index) => {
            const taskId = `remote_harvest_${targetRoomName}_${index}`;
            
            // Check if we already have a harvester for this task
            const existingHarvester = _.filter(Game.creeps, c => 
                c.memory.role === 'remoteHarvester' && c.memory.taskID === taskId
            )[0];

            if (!existingHarvester) {
                room.memory.remoteTasks[taskId] = {
                    type: 'remoteHarvester',
                    targetRoom: targetRoomName,
                    sourceId: source.id,
                    sourceIndex: index,
                    priority: 4 // Higher than scout
                };
            }
        });
    }
};

export default StrategyRemoteMining;
