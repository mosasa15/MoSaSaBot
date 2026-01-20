var roleUpgrader = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        const tasksList = Memory.rooms[creep.room.name].tasks;
        creep.memory.dontPullMe = false;  
        
        this.toggleState(creep);  
        // 执行动作  
        if (creep.memory.upgrading) {  
            creep.memory.dontPullMe = true;  
            this.upgradeController(creep);  
        } else {  
            // Try to find upgradeLink or Storage
            let upgradeLink = null;
            if (Memory.rooms[creep.room.name].upgradeLinkId) {
                upgradeLink = creep.room[Memory.rooms[creep.room.name].upgradeLinkId];
            }
            const storage = creep.room.storage;  
            
            this.harvestEnergy(creep, upgradeLink, storage);  
        } 
    },  
    toggleState: function(creep) {  
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {  
            creep.memory.upgrading = false;  
        }  
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {  
            creep.memory.upgrading = true;  
        }  
    },  

    upgradeController: function(creep) {  
        creep.memory.dontPullMe = true;  
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
        } 
    },  

    harvestEnergy: function(creep, upgradeLink, storage) {  
        const terminal = creep.room.terminal
        
        // Priority 1: Upgrade Link
        if (upgradeLink && upgradeLink.store[RESOURCE_ENERGY] > 0) {
             if (creep.withdraw(upgradeLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(upgradeLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
            return;
        }
        
        // Priority 2: Storage
        if (storage && storage.store[RESOURCE_ENERGY] > 0) {
             if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
            } 
            return;
        }
        
        // Priority 3: Terminal
        if (terminal && terminal.store[RESOURCE_ENERGY] > 0) {
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
            } 
            return;
        }

        // Priority 4: Any Container (Global Search)
        // Find closest container with enough energy
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 100 // Don't drain nearly empty ones
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
        
        // Priority 5: Harvest from Source (Fallback Logic)
        const sources = creep.room.source || creep.room.find(FIND_SOURCES);
        const sourceIndex = (creep.memory.workLoc || 0) % sources.length;
        const source = sources[sourceIndex];
        
        if (source) {
            // 5.1 Try nearby Dropped Resources
            const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
                filter: r => r.resourceType === RESOURCE_ENERGY
            })[0];
            if (dropped) {
                if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 5.2 Check for Harvester (Dedicated miner)
            const harvesters = source.pos.findInRange(FIND_MY_CREEPS, 2, {
                filter: c => c.memory.role === 'harvester' || c.memory.role === 'miner'
            });
            
            if (harvesters.length > 0) {
                // Harvester present. Since we already checked ALL containers above and found none,
                // and there is a miner here, we should just wait or park.
                // Do NOT harvest directly.
                
                // Parking Logic: Keep distance 3 from miner to avoid blocking
                if (creep.pos.getRangeTo(harvesters[0]) < 3) {
                     // Move randomly away? Or just stay put if > 1
                     // For now, let's just return. The creep will idle.
                }
                return;
            }

            // 5.3 Fallback: Direct Harvest (Only if NO dedicated harvester/miner exists)
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }  
};  
export default roleUpgrader;
