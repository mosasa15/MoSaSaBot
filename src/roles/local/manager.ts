var roleManager = {  
    /**  
     * @param {Creep} creep - The creep to run logic for.  
     */  
    run: function(creep) {
        const tasksList = Memory.rooms[creep.room.name].tasks;
        const storage = creep.room.storage;
        const terminal = creep.room.terminal;

        // Basic "Filler" Logic for low RCL / Simple Mode
        // If we have tasks, execute them.
        
        // Priority 1: Fill Extensions/Spawns (Critical)
        if(tasksList.some(task => task.type === 'fillExtension')){
            // If empty, get energy
            if(creep.store[RESOURCE_ENERGY] === 0){
                this.getEnergy(creep, storage, terminal);
            } else {
                this.fillExtensions(creep, tasksList);
            }
            return;
        }
        
        // Priority 2: Fill Towers
        if(tasksList.some(task => task.type === 'fillTower')){
            if(creep.store[RESOURCE_ENERGY] === 0){
                this.getEnergy(creep, storage, terminal);
            } else {
                this.fillTowers(creep, tasksList);
            }
            return;
        }
        
        // Priority 3: Complex Lab/Factory logic (Only if storage exists)
        if (storage && terminal) {
            // ... (Keep existing complex logic if needed, but simplified for now)
            // For now, if no tasks, just idle or help upgrade?
            // Actually, managers usually just idle if no logistical tasks.
        } else {
            // Low RCL: If nothing to fill, maybe help build or upgrade?
            // Or just transfer to storage if we are holding things?
            // For now, idle.
        }
    },

    getEnergy: function(creep, storage, terminal) {
        // Try Storage
        if (storage && storage.store[RESOURCE_ENERGY] > 0) {
            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return;
        }
        
        // Try Terminal
        if (terminal && terminal.store[RESOURCE_ENERGY] > 0) {
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return;
        }
        
        // Try Container
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return;
        }
        
        // Try Dropped Resources
        const dropped = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        if (dropped) {
            if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                creep.moveTo(dropped, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
            return;
        }
        
        // Last Resort: Harvest (Manager shouldn't really harvest, but if stuck...)
        // Actually, better to idle than harvest with CARRY parts only.
    },

    fillExtensions: function(creep, tasks) {
        const extensions = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        
        if (extensions.length > 0) {
            const closest = creep.pos.findClosestByRange(extensions);
            if(creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closest, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            // Task complete
            Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'fillExtension');
        }
    },

    fillTowers: function(creep, tasks) {
        const towers = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 200
        });
        
        if (towers.length > 0) {
            const closest = creep.pos.findClosestByRange(towers);
            if(creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closest, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'fillTower');
        }
    }
};  

export default roleManager;
