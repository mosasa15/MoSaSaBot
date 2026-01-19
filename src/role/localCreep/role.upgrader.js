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
        
        // Priority 4: Harvest from Source (RCL 1-3 fallback)
        const sources = creep.room.source || creep.room.find(FIND_SOURCES);
        const source = sources[creep.memory.workLoc] || sources[0]; // Default to first source if workLoc invalid
        
        if (source) {
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }  
};  
export default roleUpgrader;
