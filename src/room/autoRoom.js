import InsectNameManager from '@/module/creepNameManager';
import BodyGenerator from '@/utils/bodyGenerator';

var AutoRoom = {
    run: function(room) {
        // Basic validations
        if (!room || !room.controller || !room.controller.my) return;
        
        const roomName = room.name;
        const spawns = room.spawn || []; // Assumes room.spawn is available via cache
        if (spawns.length === 0) return;
        
        const firstSpawn = spawns[0];
        
        // Initialize Memory
        if (!Memory.rooms[roomName]) {
            Memory.rooms[roomName] = {};
        }
        if (!Memory.rooms[roomName].tasks) {
            Memory.rooms[roomName].tasks = [];
        }
        
        const tasksList = Memory.rooms[roomName].tasks;
        
        // Emergency Energy Logic
        if (room.energyAvailable < 750 && !tasksList.some(task => task.type === 'fillExtension')) {
             tasksList.push({ type: 'fillExtension' });
             // console.log(`[AutoRoom] ${roomName} Low energy, pushed fillExtension task.`);
        }
        
        // Generate Role Configs Dynamically
        const roleConfigs = getRoleConfigs(room);
        
        // Spawn Logic
        for (let spawn of spawns) {
            if (spawn.spawning) continue;
            
            for (let config of roleConfigs) {
                // Iterate through work locations (e.g. source indices)
                for (let workLoc of config.workLoc) {
                    if (checkCreepLimit(config.role, config.sourceRoom, config.targetRoom, workLoc, config.maxNumber)) {
                        
                        // Body Selection Logic
                        let bodyRole = config.role;
                        const body = BodyGenerator.generate(room.energyAvailable, bodyRole);
                        
                        // Attempt Spawn
                        try {
                            spawnCreep(spawn, config.role, config.sourceRoom, config.targetRoom, workLoc, body);
                        } catch (e) {
                            console.log(`[AutoRoom] Spawn Error in ${roomName}: ${e}`);
                        }
                        
                        if (spawn.spawning) break; // Busy now
                    }
                }
                if (spawn.spawning) break;
            }
        }
    }
};

function getRoleConfigs(room) {
    const roomName = room.name;
    const sources = room.source || []; // Assumes room.source is an array from cache
    const sourceLocs = sources.map((_, i) => i);
    
    // Determine dynamic limits
    const hasConstruction = room.find(FIND_CONSTRUCTION_SITES).length > 0;
    
    // Config Structure
    // Priority: Higher is more important
    const configs = [
        // Essentials
        { role: 'manager',          sourceRoom: roomName, targetRoom: roomName, workLoc: [0],     maxNumber: 1, priority: 10},
        
        // Harvesting
        { role: 'harvester',        sourceRoom: roomName, targetRoom: roomName, workLoc: sourceLocs,   maxNumber: 1, priority: 8},  
        
        // Upgrading
        { role: 'upgrader',         sourceRoom: roomName, targetRoom: roomName, workLoc: [0],     maxNumber: 1, priority: 7}, 
        
        // Building
        { role: 'builder',          sourceRoom: roomName, targetRoom: roomName, workLoc: [0],     maxNumber: hasConstruction ? 1 : 0, priority: 6},
        
        // Transferer (if needed, usually for link/storage ops)
        { role: 'transferer',       sourceRoom: roomName, targetRoom: roomName, workLoc: [0],     maxNumber: 0, priority: 9}, 
    ];
    
    return configs.sort((a, b) => b.priority - a.priority);
}

function checkCreepLimit(role, sourceRoom, targetRoom, workLoc, maxNumber) {  
    let count = 0;  
    const creeps = Game.creeps; 
    for (const name in creeps) {  
        const creep = creeps[name]; 
        if (  
            creep.memory.role === role &&  
            creep.memory.sourceRoomName === sourceRoom &&  
            creep.memory.targetRoomName === targetRoom &&  
            creep.memory.workLoc === workLoc  
        ) {  
            count++; 
        }  
    }  
    return count < maxNumber;  
}

function spawnCreep(spawn, role, sourceRoom, targetRoom, workLoc, body) {
    if (spawn.spawning === null) {
        // Safe check for energy capacity to avoid error spam
        const bodyCost = body.reduce((cost, part) => cost + BODYPART_COST[part], 0);
        if (spawn.room.energyAvailable < bodyCost) {
            // Optional: try to spawn a smaller version?
            // For now, just return.
            return;
        }

        const roomName = spawn.room.name;
        let room = Game.rooms[roomName];
        let newName = InsectNameManager.registerName(room);
        
        const result = spawn.spawnCreep(body, newName, {
            memory: {
                role: role,
                sourceRoomName: sourceRoom,
                targetRoomName: targetRoom,
                workLoc: workLoc
            }
        });
        
        if (result === OK) {
            console.log(`[AutoRoom] Spawning ${newName} (${role}) in ${roomName}`);
        }
    }
}

export default AutoRoom;
