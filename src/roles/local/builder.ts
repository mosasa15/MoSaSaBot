var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const storage = creep.room.storage;  
        const tasksList = Memory.rooms[creep.room.name].tasks;
        let targetLink = null;
        if (Memory.rooms[creep.room.name].upgradeLinkId) {
            targetLink = creep.room[Memory.rooms[creep.room.name].upgradeLinkId]; 
        }
        
        this.toggleState(creep);  
        
        if (creep.memory.building) { 
            creep.memory.dontPullMe = true; 
            let target = null;
            if (creep.memory.targetSiteId) {
                const t = Game.getObjectById(creep.memory.targetSiteId);
                if (t) target = t;
                else creep.memory.targetSiteId = null;
            }

            if (!target) {
                const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (constructionSites.length > 0) {
                    const pickClosestOfType = (type) => {
                        const typed = constructionSites.filter(s => s.structureType === type);
                        if (typed.length === 0) return null;
                        return creep.pos.findClosestByRange(typed);
                    };

                    const importantTypes = [
                        STRUCTURE_SPAWN,
                        STRUCTURE_EXTENSION,
                        STRUCTURE_TOWER,
                        STRUCTURE_STORAGE,
                        STRUCTURE_CONTAINER,
                        STRUCTURE_LINK,
                        STRUCTURE_TERMINAL,
                        STRUCTURE_LAB,
                        STRUCTURE_FACTORY,
                        STRUCTURE_POWER_SPAWN,
                        STRUCTURE_OBSERVER,
                        STRUCTURE_NUKER
                    ];
                    for (const t of importantTypes) {
                        if (target) break;
                        target = pickClosestOfType(t);
                    }
                    if (!target) target = pickClosestOfType(STRUCTURE_ROAD);
                    if (!target) target = creep.pos.findClosestByRange(constructionSites);

                    if (target) creep.memory.targetSiteId = target.id;
                }
            }

            if (target) {
                this.buildConstruction_Sites(creep, target);
            } else {
                // If no construction sites, upgrade controller
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
                } 
            }
        } else {  
            creep.memory.dontPullMe = false; 
            this.withdrawEnergy(creep, storage, targetLink);  
        }
    },
    
    buildConstruction_Sites: function(creep, targets) {  
        if(creep.build(targets) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}}); // 绘制路径
        }
    },  

    toggleState: function(creep) {  
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) { // building && 背包为空
            creep.memory.building = false;  // 变为 非building状态
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) { // 非building状态 && 背包满(空余为0)
            creep.memory.building = true;  // 变为 building状态
        }
    },  

    withdrawEnergy: function(creep,storage, targetLink) {  
        const terminal = creep.room.terminal;
        
        // Priority 1: Link
        if( targetLink && targetLink.store[RESOURCE_ENERGY] > 0){
            if (creep.withdraw(targetLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(targetLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
            return;
        } 
        
        // Priority 2: Storage
        if( storage && storage.store[RESOURCE_ENERGY] > 0 ) {
            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
            return;
        } 
        
        // Priority 3: Terminal
        if( terminal && terminal.store[RESOURCE_ENERGY] > 0 ){
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
            return;
        } 
        
        // Priority 4: Container
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
        
        // Priority 5: Source Logic (Smart Harvesting)
        const sources = creep.room.source || creep.room.find(FIND_SOURCES);
        const sourceIndex = (creep.memory.workLoc || 0) % sources.length;
        const source = sources[sourceIndex];
        
        if (source) {
            // 5.1 Try nearby Container
            const sourceContainer = source.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            })[0];
            if (sourceContainer) {
                if (creep.withdraw(sourceContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(sourceContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 5.2 Try nearby Dropped Resources
            const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
                filter: r => r.resourceType === RESOURCE_ENERGY
            })[0];
            if (dropped) {
                if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 5.3 Check for Harvester
            const harvesters = source.pos.findInRange(FIND_MY_CREEPS, 2, {
                filter: c => c.memory.role === 'harvester'
            });
            
            if (harvesters.length > 0) {
                // Harvester present, wait nearby but don't block
                const harvester = harvesters[0];
                if (creep.pos.getRangeTo(harvester) > 2) {
                    creep.moveTo(harvester, { range: 2, visualizePathStyle: { stroke: '#5555ff', opacity: 0.5 } });
                }
                // Just wait, do not harvest
                return;
            }

            // 5.4 Fallback: Direct Harvest (Only if no harvester)
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
        }
    } 
    
};

export default roleBuilder;
