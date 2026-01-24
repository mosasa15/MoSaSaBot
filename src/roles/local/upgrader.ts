import { ECONOMY_CONTROL } from '@/config/economyConfig';
import { DOWNGRADE_PROTECTION } from '@/config/protectionConfig';

var roleUpgrader = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        const room = creep.room;
        const roomName = room.name;
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
        if (!Memory.rooms[roomName].tasks) Memory.rooms[roomName].tasks = [];
        const tasksList = Memory.rooms[roomName].tasks;
        creep.memory.dontPullMe = false;  
        const pauseUpgrade = this.shouldPauseUpgrade(creep, tasksList);
        
        this.toggleState(creep);  
        // 执行动作  
        if (creep.memory.upgrading) {  
            if (pauseUpgrade) {
                creep.memory.dontPullMe = false;
                this.supportRoom(creep, tasksList);
            } else {
                creep.memory.dontPullMe = true;  
                this.upgradeController(creep);  
            }
        } else {  
            // Try to find upgradeLink or Storage
            let upgradeLink = null;
            if (Memory.rooms[roomName].upgradeLinkId) {
                upgradeLink = room[Memory.rooms[roomName].upgradeLinkId];
            }
            const storage = room.storage;  
            
            this.harvestEnergy(creep, upgradeLink, storage, pauseUpgrade);  
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

    shouldPauseUpgrade: function(creep, tasksList) {
        const room = creep.room;
        const controller = room.controller;
        if (!controller || !controller.my) return false;
        if (creep.memory.role === 'savior') return false;
        const throttle = ECONOMY_CONTROL.UPGRADE_THROTTLE;
        if (controller.level < throttle.MIN_RCL) return false;
        if (this.isDowngradeUrgent(room)) return false;

        const roomName = room.name;
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
        if (!Memory.rooms[roomName].economy) Memory.rooms[roomName].economy = {};

        const energyCap = room.energyCapacityAvailable || 0;
        const energyRatio = energyCap > 0 ? room.energyAvailable / energyCap : 1;

        const storageEnergy = room.storage ? (room.storage.store[RESOURCE_ENERGY] || 0) : undefined;

        const hasFillExtensionTask = Array.isArray(tasksList) && tasksList.some(t => t && t.type === 'fillExtension');

        const prevPaused = Memory.rooms[roomName].economy.pauseUpgrading === true;
        let paused = prevPaused;

        if (paused) {
            const energyRecovered = energyRatio >= throttle.ENERGY_RATIO_RESUME;
            const storageRecovered = storageEnergy === undefined || storageEnergy >= throttle.STORAGE_ENERGY_RESUME;
            if (energyRecovered && storageRecovered && !hasFillExtensionTask) paused = false;
        } else {
            const energyLow = energyRatio <= throttle.ENERGY_RATIO_PAUSE;
            const storageLow = storageEnergy !== undefined && storageEnergy <= throttle.STORAGE_ENERGY_PAUSE;
            if (hasFillExtensionTask || energyLow || storageLow) paused = true;
        }

        Memory.rooms[roomName].economy.pauseUpgrading = paused;
        return paused;
    },

    isDowngradeUrgent: function(room) {
        const controller = room.controller;
        if (!controller || !controller.my) return false;
        if (controller.ticksToDowngrade < DOWNGRADE_PROTECTION.CRITICAL_THRESHOLD_TICKS) return true;
        const maxTicks = (CONTROLLER_DOWNGRADE && CONTROLLER_DOWNGRADE[controller.level]) || 0;
        if (maxTicks && controller.ticksToDowngrade < maxTicks * DOWNGRADE_PROTECTION.WARNING_THRESHOLD_PERCENT) return true;
        return false;
    },

    supportRoom: function(creep, tasksList) {
        if (creep.store[RESOURCE_ENERGY] <= 0) return;
        if (this.fillSpawnsAndExtensions(creep)) return;
        const hasFillTowerTask = Array.isArray(tasksList) && tasksList.some(t => t && t.type === 'fillTower');
        if (hasFillTowerTask && this.fillTowers(creep)) return;
        const storage = creep.room.storage;
        if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }
    },

    fillSpawnsAndExtensions: function(creep) {
        const targets = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if (targets.length <= 0) return false;
        const closest = creep.pos.findClosestByRange(targets);
        if (!closest) return false;
        if (creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return true;
    },

    fillTowers: function(creep) {
        const towers = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 200
        });
        if (towers.length <= 0) return false;
        const closest = creep.pos.findClosestByRange(towers);
        if (!closest) return false;
        if (creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return true;
    },

    harvestEnergy: function(creep, upgradeLink, storage, pauseUpgrade) {  
        const terminal = creep.room.terminal
        const throttle = ECONOMY_CONTROL.UPGRADE_THROTTLE;
        const storageEnergy = storage ? (storage.store[RESOURCE_ENERGY] || 0) : 0;
        const allowStorage = !pauseUpgrade || !storage || storageEnergy > throttle.STORAGE_ENERGY_PAUSE;
        
        // Priority 1: Upgrade Link
        if (upgradeLink && upgradeLink.store[RESOURCE_ENERGY] > 0) {
             if (creep.withdraw(upgradeLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(upgradeLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
            return;
        }
        
        // Priority 2: Storage
        if (allowStorage && storage && storage.store[RESOURCE_ENERGY] > 0) {
             if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
            } 
            return;
        }
        
        // Priority 3: Terminal
        if (allowStorage && terminal && terminal.store[RESOURCE_ENERGY] > 0) {
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
            } 
            return;
        }

        // Priority 4: Any Container (Global Search)
        // Find closest container with enough energy
        const container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 100 // Don't drain nearly empty ones
        });
        if (container) {
            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
            return;
        }
        
        // Priority 5: Harvest from Source (Fallback Logic)
        const sources = creep.room.source || creep.room.find(FIND_SOURCES);
        const sourceIndex = (creep.memory.workLoc || 0) % sources.length;
        const source = sources[sourceIndex];
        
        if (source) {
            // 5.1 Try nearby Dropped Resources
            const dropped = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
                filter: r => r.resourceType === RESOURCE_ENERGY
            })[0];
            if (dropped) {
                if (creep.pickup(dropped) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(dropped, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                return;
            }

            // 5.2 Check for Harvester (Dedicated miner)
            const harvesters = source.pos.findInRange(FIND_MY_CREEPS, 2, {
                filter: c => c.memory.role === 'harvester' || c.memory.role === 'miner'
            });
            
            if (harvesters.length > 0) {
                // Harvester present. Since we already checked ALL containers above and found none,
                // and there is a miner here, we should just wait or park.
                // Do NOT harvest directly.
                
                // Parking Logic: Keep distance 3 from miner to avoid blocking
                if (creep.pos.getRangeTo(harvesters[0]) < 3) {
                     // Move randomly away? Or just stay put if > 1
                     // For now, let's just return. The creep will idle.
                }
                return;
            }

            // 5.3 Fallback: Direct Harvest (Only if NO dedicated harvester/miner exists)
            if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }  
};  
export default roleUpgrader;
