// @ts-nocheck
var roleScout = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;

        if (!targetRoom) {
            console.log(`Scout ${creep.name} has no target room! Suiciding.`);
            creep.suicide();
            return;
        }

        if (creep.room.name !== targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, targetRoom), { visualizePathStyle: { stroke: '#ffffff' } });
        } else {
            // We are in the target room, gather intelligence
            this.scoutRoom(creep);
            const center = new RoomPosition(25, 25, targetRoom);
            if (creep.pos.getRangeTo(center) > 6) {
                creep.moveTo(center, { range: 6, visualizePathStyle: { stroke: '#ffffff' } });
            }
            
            // Mission accomplished, maybe recycle or move to next target?
            // For now, just stay here to monitor or suicide to save CPU if single-use.
            // But usually scouts update info periodically.
            
            // If the room is dangerous, flee?
            // Logic handled in scoutRoom
        }
    },

    scoutRoom: function(creep) {
        const room = creep.room;
        if (!Memory.rooms[room.name]) {
            Memory.rooms[room.name] = {};
        }

        const roomMemory = Memory.rooms[room.name];
        
        // 1. Check for Hostiles
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        const dangerousHostiles = hostiles.filter(c => c.getActiveBodyparts(ATTACK) > 0 || c.getActiveBodyparts(RANGED_ATTACK) > 0);
        const invaderCore = room.find(FIND_HOSTILE_STRUCTURES, { filter: s => s.structureType === STRUCTURE_INVADER_CORE })[0];
        
        roomMemory.scouted = true;
        roomMemory.scoutTime = Game.time;
        roomMemory.hostileCount = dangerousHostiles.length;
        roomMemory.hasInvaderCore = !!invaderCore;
        
        // 2. Check Sources
        const sources = room.find(FIND_SOURCES);
        roomMemory.sources = sources.map(s => ({
            id: s.id,
            pos: { x: s.pos.x, y: s.pos.y, roomName: s.pos.roomName }
        }));
        
        // 3. Check Controller (Owner/Reservation)
        if (room.controller) {
            roomMemory.owner = room.controller.owner ? room.controller.owner.username : null;
            roomMemory.reservation = room.controller.reservation ? {
                username: room.controller.reservation.username,
                ticksToEnd: room.controller.reservation.ticksToEnd
            } : null;
        } else {
            roomMemory.owner = null;
            roomMemory.reservation = null;
        }
        
        // 4. Mark as suitable for mining?
        // Criteria: Not owned by others, not reserved by others, no dangerous hostiles
        const isSafe = !roomMemory.owner && 
                       (!roomMemory.reservation || roomMemory.reservation.username === 'Invader' || roomMemory.reservation.username === 'Mosasa'); // Assuming Mosasa is us
        
        roomMemory.isSafe = isSafe && roomMemory.hostileCount === 0 && !roomMemory.hasInvaderCore;
    }
};

export default roleScout;
