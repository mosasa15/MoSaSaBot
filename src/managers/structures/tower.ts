var Tower = {  
    /**  
     * @param {StructureTower} tower - 当前的塔对象  
     */  
    run: function( roomName ) {  
        let room = Game.rooms[roomName];    
        if(!room) return;

        const towers = room.tower || room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        if (!towers || towers.length === 0) return;

        if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
        const roomMemory = Memory.rooms[roomName];
        if (!roomMemory.tasks) roomMemory.tasks = [];
        const tasksList = roomMemory.tasks;

        // Run logic every tick for critical defense, but maybe less often for repair?
        // Defense is critical, so check every tick.
        
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        
        if (hostiles.length > 0) {
            // Defense Mode
            this.defend(towers, hostiles);
        } else {
            // Repair/Heal Mode
            this.maintain(towers, tasksList);
        }
    },

    defend: function(towers, hostiles) {
        // Sort hostiles by threat (e.g., healers first, or closest)
        // Simple strategy: Attack closest to each tower or focus fire.
        // Focus fire is generally better.
        
        // Filter out allies if you have a whitelist system (omitted for pure auto for now, or add back if needed)
        // const targets = hostiles.filter(c => !isAlly(c.owner.username));
        const targets = hostiles; // Attack everyone not me

        if (targets.length === 0) return;

        const target = targets[0]; // Focus fire on the first one (maybe sort by hits?)
        
        for (let tower of towers) {
            tower.attack(target);
        }
    },

    maintain: function(towers, tasksList) {
        for (let tower of towers) {
            // 1. Request Energy if low
            if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < 600) {
                if (!tasksList.some(task => task.type === 'fillTower' && task.id === tower.id)) {
                    tasksList.push({ type: 'fillTower', id: tower.id });
                }
            }

            // 2. Heal Creeps
            const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (c) => c.hits < c.hitsMax
            });
            if (damagedCreep) {
                tower.heal(damagedCreep);
                continue;
            }

            // 3. Repair (only if energy is high enough to save for defense)
            if (tower.store.getUsedCapacity(RESOURCE_ENERGY) > 600) {
                // Priority: Ramparts (low hits) > Roads > Containers
                
                // Ramparts critical check
                const criticalRampart = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.structureType === STRUCTURE_RAMPART && s.hits < 5000 // Critical threshold
                });
                if (criticalRampart) {
                    tower.repair(criticalRampart);
                    continue;
                }

                // General Repair (throttle to save CPU)
                if (Game.time % 10 === 0) {
                    const target = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (s) => {
                            if (s.structureType === STRUCTURE_RAMPART && s.hits < 100000) return true; // Maintain threshold
                            if (s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax * 0.8) return true;
                            if (s.structureType === STRUCTURE_CONTAINER && s.hits < s.hitsMax * 0.8) return true;
                            return false;
                        }
                    });
                    if (target) {
                        tower.repair(target);
                    }
                }
            }
        }
    }
};  

export default Tower;
