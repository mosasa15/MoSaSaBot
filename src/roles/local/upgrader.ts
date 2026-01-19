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
        
        // Priority 4: Harvest from Source (Smart Logic)
        const sources = creep.room.source || creep.room.find(FIND_SOURCES);
        const sourceIndex = (creep.memory.workLoc || 0) % sources.length;
        const source = sources[sourceIndex];
        
        if (source) {
            // 4.1 Try nearby Container
            const sourceContainer = source.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            })[0];
            if (sourceContainer) {
                if (creep.withdraw(sourceContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sourceContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 4.2 Try nearby Dropped Resources
            const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
                filter: r => r.resourceType === RESOURCE_ENERGY
            })[0];
            if (dropped) {
                if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 4.3 Check for Harvester
            const harvesters = source.pos.findInRange(FIND_MY_CREEPS, 2, {
                filter: c => c.memory.role === 'harvester'
            });
            
            if (harvesters.length > 0) {
                // Harvester present, wait nearby
                const harvester = harvesters[0];
                if (creep.pos.getRangeTo(harvester) > 2) {
                    creep.moveTo(harvester, { range: 2, visualizePathStyle: { stroke: '#5555ff', opacity: 0.5 } });
                }
                return;
            }

            // 4.4 Fallback: Direct Harvest
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }  
};  
export default roleUpgrader;
