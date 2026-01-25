// @ts-nocheck
var roleHarvester = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        try {
            creep.memory.dontPullMe = true;
            if (creep.memory.bornTime === undefined) creep.memory.bornTime = Game.time;

            const room = creep.room;
            const sources = room.source || room.find(FIND_SOURCES);
            if (!sources || sources.length <= 0) return;

            const rawLoc = typeof creep.memory.workLoc === 'number' ? creep.memory.workLoc : 0;
            const workLoc = ((rawLoc % sources.length) + sources.length) % sources.length;
            creep.memory.workLoc = workLoc;

            const targetSource = sources[workLoc];
            if (!targetSource) return;

            if (!Memory.rooms) Memory.rooms = {};
            if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
            if (!Memory.rooms[room.name].sourceStations) Memory.rooms[room.name].sourceStations = {};
            if (!Memory.rooms[room.name].sourceStations[workLoc]) Memory.rooms[room.name].sourceStations[workLoc] = {};
            const station = Memory.rooms[room.name].sourceStations[workLoc];

            const container = this.findSourceContainer(targetSource);
            const links = targetSource.pos.findInRange(FIND_STRUCTURES, 2, {
                filter: s => s.structureType === STRUCTURE_LINK
            });
            const link = links && links.length > 0 ? links[0] : null;

            if (container) station.containerId = container.id;
            if (link) station.linkId = link.id;

            if (creep.pos.isNearTo(targetSource)) {
                const travel = Math.max(0, Game.time - (creep.memory.bornTime || Game.time));
                if (typeof station.pathTime !== 'number') station.pathTime = travel;
                else station.pathTime = Math.round(station.pathTime * 0.8 + travel * 0.2);
            }

            const dropped = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1)[0];
            if (dropped && dropped.resourceType === RESOURCE_ENERGY) creep.pickup(dropped);
            const tombstone = creep.pos.findInRange(FIND_TOMBSTONES, 1, { filter: t => t.store[RESOURCE_ENERGY] > 0 })[0];
            if (tombstone) creep.withdraw(tombstone, RESOURCE_ENERGY);

            if (container) {
                if (!creep.pos.isEqualTo(container.pos)) {
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' }, range: 0 });
                    return;
                }

                if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                    return;
                }

                if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    if (link && creep.pos.isNearTo(link) && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        creep.transfer(link, RESOURCE_ENERGY);
                    } else if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        creep.transfer(container, RESOURCE_ENERGY);
                    } else {
                        creep.drop(RESOURCE_ENERGY);
                    }
                }
                return;
            }

            if (room.controller && room.controller.level >= 2 && creep.pos.isNearTo(targetSource)) {
                const hasContainerSite = targetSource.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
                    filter: s => s.structureType === STRUCTURE_CONTAINER
                }).length > 0;
                if (!hasContainerSite) room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
            }

            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            const target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
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
