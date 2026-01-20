// @ts-nocheck
var roleEarlyUpgrader = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // Initialize state if not set
        if (creep.memory.upgrading === undefined) {
            creep.memory.upgrading = false;
        }

        // State toggling
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }

        if (creep.memory.upgrading) {
            // Upgrade Controller
            // Prevent swapping when upgrading to maintain position
            creep.memory.dontPullMe = true;
            
            if (creep.room.controller) {
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        } else {
            // Harvesting Phase
            creep.memory.dontPullMe = false;

            // 1. Pickup Dropped Resources (Most efficient, saves harvest time)
            const droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
            });
            if (droppedEnergy) {
                if (creep.pickup(droppedEnergy) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(droppedEnergy, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 2. Withdraw from Tombstones (Scavenge from dead creeps)
            const tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
                filter: t => t.store[RESOURCE_ENERGY] > 0
            });
            if (tombstone) {
                if (creep.withdraw(tombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }
            
            // 3. Withdraw from Ruins (if any)
            const ruin = creep.pos.findClosestByRange(FIND_RUINS, {
                filter: r => r.store[RESOURCE_ENERGY] > 0
            });
             if (ruin) {
                if (creep.withdraw(ruin, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(ruin, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 4. Try Container (if built by miner)
            const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
            });
            if (container) {
                 if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 5. Harvest from Source
            // Find closest active source to minimize travel
            const source = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE);
            if (source) {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            } else {
                 // Fallback: if no active source, move to any source (to wait)
                 const anySource = creep.pos.findClosestByRange(FIND_SOURCES);
                 if (anySource) {
                     creep.moveTo(anySource, { visualizePathStyle: { stroke: '#ffaa00' } });
                 }
            }
        }
    }
};

export default roleEarlyUpgrader;
