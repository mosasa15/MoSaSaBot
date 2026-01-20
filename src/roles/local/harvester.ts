// @ts-nocheck
var roleHarvester = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        try {
            creep.memory.dontPullMe = true;  
            const workLoc = creep.memory.workLoc;
            const room = creep.room;
            const { source } = room;
            
            // Auto-correct invalid workLoc
            if (!source[workLoc]) {
                const newLoc = (workLoc || 0) % (source.length || 1);
                creep.memory.workLoc = newLoc;
                // creep.say('🔄 FixLoc'); // Optional debug say
            }
            
            let targetSource = source[creep.memory.workLoc];
            
            if (!targetSource) return;

            // --- State Latching Logic ---
            if (creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
                creep.memory.working = false;
                creep.say('🔄 Harvest');
            }
            if (!creep.memory.working && creep.store.getFreeCapacity() === 0) {
                creep.memory.working = true;
                creep.say('🚧 Work');
            }

            // --- Scavenging Logic (Always active) ---
            // Pick up dropped resources in range 1
            const dropped = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0];
            if (dropped) {
                creep.pickup(dropped);
            }
            // Withdraw from tombstones in range 1
            const tombstone = creep.pos.findInRange(FIND_TOMBSTONES, 1, {
                filter: t => t.store[RESOURCE_ENERGY] > 0
            })[0];
            if (tombstone) {
                creep.withdraw(tombstone, RESOURCE_ENERGY);
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
                // Enhanced Link Finding (Check all links in range 2)
                const links = targetSource.pos.findInRange(FIND_STRUCTURES, 2, {
                    filter: s => s.structureType === STRUCTURE_LINK
                });
                const link = links[0]; // Just take the first one found

                // Priority 1: Link (Transfer or Repair)
                if (link) {
                    // Repair link if damaged (< 90%)
                    if (link.hits < link.hitsMax * 0.9) {
                        creep.repair(link);
                        return;
                    }
                    // Transfer to link if it has capacity
                    if (link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                         if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(link, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                        return;
                    }
                } 
                
                // Priority 2: Container (Transfer or Repair)
                if (container) {
                    // Repair container if damaged (< 90%)
                    if (container.hits < container.hitsMax * 0.9) {
                        creep.repair(container);
                        return;
                    } 
                    // Transfer to container
                    if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        if (creep.transfer(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
                        }
                        return;
                    }
                } 
                
                // Priority 3: Construction Sites (Any nearby)
                // 63bot Logic: Build any site in range 1 (prioritize container)
                const sites = creep.pos.findInRange(FIND_CONSTRUCTION_SITES, 3);
                if (sites.length > 0) {
                    const containerSite = sites.find(s => s.structureType === STRUCTURE_CONTAINER);
                    
                    if (containerSite) {
                        // Check for nearby hauler (manager/transferer) to offload energy first
                        const nearbyHauler = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
                            filter: (c) => c.store.getFreeCapacity(RESOURCE_ENERGY) > 0 && 
                                          (c.memory.role === 'manager' || c.memory.role === 'transferer' || c.memory.role === 'centralTransferer')
                        })[0];

                        if (nearbyHauler) {
                            creep.transfer(nearbyHauler, RESOURCE_ENERGY);
                        } else {
                            if (creep.build(containerSite) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(containerSite, { visualizePathStyle: { stroke: '#ffffff' } });
                            }
                        }
                        return;
                    } else {
                        // Build other nearby sites (Roads, Links)
                        const closestSite = creep.pos.findClosestByRange(sites);
                        if (closestSite) {
                            if (creep.build(closestSite) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(closestSite);
                            }
                            return;
                        }
                    }
                } 

                // Priority 4: Extensions/Spawns (RCL 1 fallback)
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
                    return;
                }
                
                // Priority 5: Create Container Site (if none exists and we have energy to build)
                // Only if RCL >= 2
                if (creep.room.controller.level >= 2 && !container) {
                    // Only create if we are right next to source to avoid weird placements
                    if (creep.pos.isNearTo(targetSource)) {
                        const existingSites = targetSource.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                             filter: s => s.structureType === STRUCTURE_CONTAINER
                        });
                        if (existingSites.length === 0) {
                            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                        }
                    }
                }
                
                // Priority 6: Storage
                if (creep.room.storage) {
                        if (creep.transfer(creep.room.storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.storage, { visualizePathStyle: { stroke: '#ffffff' } });
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
    }
};  

export default roleHarvester;
