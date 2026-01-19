var roleHarvester = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        try {
            creep.memory.dontPullMe = true;  
            const workLoc = creep.memory.workLoc;
            const room = creep.room;
            const { source } = room;
            
            if (!source || !source[workLoc]) {
                // Fallback if source is not found (shouldn't happen if workLoc is correct)
                return; 
            }
            
            let targetSource = source[workLoc];
            
            // 确定当前应该使用的运输目标
            let currentTarget = this.determineTarget(creep, targetSource);
            
            // 如果背包未满，继续采集
            if (creep.store.getFreeCapacity() > 0) {
                if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } 
            // 如果背包满了，开始转移资源
            else {
                if (currentTarget) {
                    this.transferResources(creep, currentTarget);
                } else {
                    // No target? Drop it or build a container?
                    // For now, if no container/link/storage, maybe transfer to Spawn/Extension?
                    // Or just drop it if we are a static miner. 
                    // But for generic RCL1, we are likely a mobile harvester.
                    // If mobile harvester, we should look for Spawn/Extension if no storage.
                    const spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
                    const extension = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: (s) => s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    });
                    
                    let fallbackTarget = extension || spawn;
                    
                    // If Spawn is full, maybe build construction site?
                    if (!fallbackTarget || fallbackTarget.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                        const site = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
                        if (site) {
                            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(site);
                            }
                            return;
                        }
                        // Upgrade controller if nothing else
                        if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.controller);
                        }
                    } else {
                        this.transferResources(creep, fallbackTarget);
                    }
                }
            }
        } catch (e) {
            console.log(`Error in Harvester ${creep.name}: ${e}`);
        }
    },

    // 确定资源转移目标
    determineTarget: function(creep, targetSource) {
        const room = creep.room;
        const { link, storage } = room;
        const workLoc = creep.memory.workLoc;

        // 如果有对应的link且link可用，优先使用link
        if (link && link[workLoc]) {
            return link[workLoc];
        }
        
        // 如果有storage，使用storage
        if (storage) {
            return storage;
        }

        // 寻找或创建container
        let container = this.findSourceContainer(targetSource);
        if (container) {
            return container;
        }

        return null;
    },

    // 寻找能量源附近的container
    findSourceContainer: function(source) {
        if (!source) return null;
        
        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        
        return containers.length > 0 ? containers[0] : null;
    },

    // 转移资源到目标
    transferResources: function(creep, target) {
        if (!target) return;
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};  

export default roleHarvester;
