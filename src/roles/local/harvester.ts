// @ts-nocheck
var roleHarvester = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        try {
            creep.memory.dontPullMe = true;  
            const workLoc = creep.memory.workLoc;
            const room = creep.room;
            const { source } = room;
            
            if (!source || !source[workLoc]) {
                return; 
            }
            
            let targetSource = source[workLoc];

            // --- State Latching Logic ---
            // If working (transferring/building) and empty, switch to harvesting
            if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
                creep.memory.working = false;
                creep.say('🔄 Harvest');
            }
            // If harvesting and full, switch to working
            if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
                creep.memory.working = true;
                creep.say('🚧 Work');
            }

            // --- Action Logic ---
            if (!creep.memory.working) {
                // Harvesting State
                if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                // Working State
                const container = this.findSourceContainer(targetSource);
                const link = this.findSourceLink(creep, workLoc);

                // Priority 1: Link
                if (link) {
                    if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(link, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                } 
                // Priority 2: Container
                else if (container) {
                    // Repair container if needed (maintenance)
                    if (container.hits < container.hitsMax) {
                        if (creep.repair(container) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    } else {
                        // Transfer to container
                        if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                    }
                } 
                // Priority 3: Construction Site (Container)
                else {
                    const site = this.findContainerSite(targetSource);
                    if (site) {
                        // Check for nearby hauler (manager/transferer) to offload energy first
                        const nearbyHauler = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                            filter: (c) => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && 
                                          (c.memory.role === 'manager' || c.memory.role === 'transferer' || c.memory.role === 'centralTransferer')
                        })[0];

                        if (nearbyHauler) {
                            creep.transfer(nearbyHauler, RESOURCE_ENERGY);
                        } else {
                            if (creep.build(site) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
                            }
                        }
                    } 
                    // Priority 4: Extensions/Spawns (RCL 1 fallback)
                    else {
                        const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                            filter: (structure) => {
                                return (structure.structureType === STRUCTURE_EXTENSION ||
                                        structure.structureType === STRUCTURE_SPAWN) &&
                                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                            }
                        });
                        
                        if (target) {
                            if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                            }
                        }
                        // Priority 5: Create Container Site (if none exists and we have energy to build)
                        // Only if RCL >= 2
                        else if (creep.room.controller.level >= 2) {
                            // Only create if we are right next to source to avoid weird placements
                            if (creep.pos.isNearTo(targetSource)) {
                                creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                            }
                        }
                        // Priority 6: Storage
                        else if (creep.room.storage) {
                             if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffffff' } });
                            }
                        }
                    }
                }
            }

        } catch (e) {
            console.log(`Error in Harvester ${creep.name}: ${e}`);
        }
    },

    findSourceContainer: function(source) {
        if (!source) return null;
        // Find container within range 1 of source
        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        return containers.length > 0 ? containers[0] : null;
    },

    findSourceLink: function(creep, workLoc) {
        // Use cached link if available
        const room = creep.room;
        if (room.link && room.link[workLoc]) {
            return room.link[workLoc];
        }
        return null;
    },

    findContainerSite: function(source) {
        if (!source) return null;
        const sites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        return sites.length > 0 ? sites[0] : null;
    }
};  

export default roleHarvester;
