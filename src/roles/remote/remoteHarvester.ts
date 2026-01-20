// @ts-nocheck
var roleRemoteHarvester = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const targetRoom = creep.memory.targetRoom;
        const sourceId = creep.memory.sourceId;

        if (!targetRoom || !sourceId) {
            console.log(`RemoteHarvester ${creep.name} missing target info!`);
            return;
        }

        if (creep.room.name !== targetRoom) {
            creep.moveTo(new RoomPosition(25, 25, targetRoom), { visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
            // In target room
            const source = Game.getObjectById(sourceId);
            if (source) {
                // 1. Harvest
                if (creep.store.getFreeCapacity() > 0) {
                    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                    }
                } else {
                    // 2. Full - Transfer logic
                    // If we have a container nearby, drop it there or build one
                    // For RCL 2 start, we might not have haulers yet, so maybe return home?
                    // User said "Start mining external energy". Usually implies hauling.
                    // For now, let's assume we build a container and drop energy, waiting for a hauler.
                    // OR if we are the hauler (generic role), we go back.
                    // Let's implement "Static Remote Miner" behavior + Build Container.

                    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
                        filter: s => s.structureType === STRUCTURE_CONTAINER
                    })[0];

                    if (container) {
                        // Repair if needed
                        if (container.hits < container.hitsMax * 0.9) {
                            creep.repair(container);
                        } else {
                            // Transfer to container
                            creep.transfer(container, RESOURCE_ENERGY);
                        }
                    } else {
                        // Build Container
                        const site = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                            filter: s => s.structureType === STRUCTURE_CONTAINER
                        })[0];
                        
                        if (site) {
                            creep.build(site);
                        } else {
                            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
                        }
                    }
                }
            } else {
                // Source not visible? Should be if we are in room.
                creep.moveTo(new RoomPosition(25, 25, targetRoom));
            }
        }
    }
};

export default roleRemoteHarvester;
