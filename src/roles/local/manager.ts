import { ensureRoomTasks, removeRoomTasks } from '@/utils/roomTasks';
import { BotTask, TaskSystem } from '@/systems/tasks/TaskSystem';

var roleManager = {  
    /**  
     * @param {Creep} creep - The creep to run logic for.  
     */  
    run: function(creep) {
        const room = creep.room;
        const roomName = room.name;
        const tasksList = ensureRoomTasks(roomName);
        const storage = room.storage;
        const terminal = room.terminal;
        const roomMemory = Memory.rooms[roomName] || {};

        const handled = this.runTaskSystem(creep, storage, terminal, roomMemory);
        if (handled) return;
 
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

        // Priority 3: Feed Upgrade Link (for upgrader efficiency)
        if(tasksList.some(task => task.type === 'transferToUpgradeLink')){
            const upgradeLink = roomMemory.upgradeLinkId ? (Game.getObjectById(roomMemory.upgradeLinkId) as StructureLink | null) : null;
            if (!upgradeLink) {
                removeRoomTasks(roomName, t => t.type === 'transferToUpgradeLink');
                return;
            }
            if (upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) >= 600) {
                removeRoomTasks(roomName, t => t.type === 'transferToUpgradeLink');
                return;
            }
            if (creep.store[RESOURCE_ENERGY] === 0) {
                this.getEnergy(creep, storage, terminal);
            } else {
                if (creep.transfer(upgradeLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(upgradeLink, { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
            return;
        }

        // Priority 4: Drain Center Link back to Storage
        if(tasksList.some(task => task.type === 'transferToStorage')){
            const centerLink = roomMemory.centerLinkId ? (Game.getObjectById(roomMemory.centerLinkId) as StructureLink | null) : null;
            if (!centerLink || !storage) {
                removeRoomTasks(roomName, t => t.type === 'transferToStorage');
                return;
            }
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0 && creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (centerLink.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) {
                    removeRoomTasks(roomName, t => t.type === 'transferToStorage');
                    return;
                }
                if (creep.withdraw(centerLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(centerLink, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
                }
                return;
            }
            removeRoomTasks(roomName, t => t.type === 'transferToStorage');
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
 
    runTaskSystem: function(creep, storage, terminal, roomMemory): boolean {
        const roomName = creep.room.name;
        const queue = TaskSystem.list(roomName);
 
        let activeTask: BotTask | undefined;
        const activeTaskId = (creep.memory as any).activeTaskId as string | undefined;
        if (activeTaskId) activeTask = queue.find(t => t && t.id === activeTaskId);
 
        if (
            activeTask &&
            activeTask.claimUntil &&
            activeTask.claimUntil > Game.time &&
            activeTask.claimBy &&
            activeTask.claimBy !== creep.name
        ) {
            (creep.memory as any).activeTaskId = undefined;
            activeTask = undefined;
        }
 
        if (!activeTask) {
            const claimed = TaskSystem.claim(
                roomName,
                creep.name,
                (t) =>
                    t.roomName === roomName &&
                    (t.type === 'fillExtension' ||
                        t.type === 'fillTower' ||
                        t.type === 'transferToUpgradeLink' ||
                        t.type === 'transferToStorage' ||
                        t.type === 'storeTransfer')
            );
            if (claimed) {
                (creep.memory as any).activeTaskId = claimed.id;
                activeTask = claimed;
            }
        }
 
        if (!activeTask) return false;
 
        const completed = this.executeTask(creep, activeTask, storage, terminal, roomMemory);
        if (completed) {
            TaskSystem.complete(roomName, activeTask.id);
            (creep.memory as any).activeTaskId = undefined;
        }
        return true;
    },
 
    executeTask: function(creep, task: BotTask, storage, terminal, roomMemory): boolean {
        const room = creep.room;
        const roomName = room.name;
 
        if (task.type === 'fillExtension') {
            const targets = room.find(FIND_MY_STRUCTURES, {
                filter: (s) =>
                    (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) &&
                    s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (targets.length === 0) return true;
            if (creep.store[RESOURCE_ENERGY] === 0) {
                this.getEnergy(creep, storage, terminal);
                return false;
            }
            const closest = creep.pos.findClosestByRange(targets);
            if (closest && creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(closest);
            return false;
        }
 
        if (task.type === 'fillTower') {
            const targetId = (task as any).id as Id<StructureTower> | undefined;
            const tower = targetId ? (Game.getObjectById(targetId) as StructureTower | null) : null;
            if (tower && tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                if (creep.store[RESOURCE_ENERGY] === 0) {
                    this.getEnergy(creep, storage, terminal);
                    return false;
                }
                if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(tower);
                return false;
            }
 
            const towers = room.find(FIND_MY_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            }) as StructureTower[];
            if (towers.length === 0) return true;
 
            if (creep.store[RESOURCE_ENERGY] === 0) {
                this.getEnergy(creep, storage, terminal);
                return false;
            }
            const closest = creep.pos.findClosestByRange(towers);
            if (closest && creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(closest);
            return false;
        }
 
        if (task.type === 'transferToUpgradeLink') {
            const upgradeLink = roomMemory.upgradeLinkId
                ? (Game.getObjectById(roomMemory.upgradeLinkId) as StructureLink | null)
                : null;
            if (!upgradeLink) return true;
            if (upgradeLink.store.getUsedCapacity(RESOURCE_ENERGY) >= 600) return true;
            if (creep.store[RESOURCE_ENERGY] === 0) {
                this.getEnergy(creep, storage, terminal);
                return false;
            }
            if (creep.transfer(upgradeLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(upgradeLink);
            return false;
        }
 
        if (task.type === 'transferToStorage') {
            const centerLink = roomMemory.centerLinkId
                ? (Game.getObjectById(roomMemory.centerLinkId) as StructureLink | null)
                : null;
            if (!centerLink || !storage) return true;
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                if (centerLink.store.getUsedCapacity(RESOURCE_ENERGY) <= 0) return true;
                if (creep.withdraw(centerLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(centerLink);
                return false;
            }
            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) creep.moveTo(storage);
            return false;
        }
 
        if (task.type === 'storeTransfer') {
            const fromId = (task as any).from as Id<any> | undefined;
            const toId = (task as any).to as Id<any> | undefined;
            const resourceType = (task as any).resourceType as ResourceConstant | undefined;
            let amount = (task as any).amount as number | undefined;
            if (!fromId || !toId || !resourceType) return true;
            if (!amount || amount <= 0) return true;
 
            const from = Game.getObjectById(fromId) as any;
            const to = Game.getObjectById(toId) as any;
            if (!from || !to) return true;
 
            const carried = creep.store.getUsedCapacity(resourceType);
            if (carried === 0) {
                if (creep.store.getFreeCapacity() <= 0) return false;
                const take = Math.min(amount, creep.store.getFreeCapacity(resourceType));
                const code = creep.withdraw(from, resourceType, take);
                if (code === ERR_NOT_IN_RANGE) creep.moveTo(from);
                return false;
            }
 
            const give = Math.min(carried, amount);
            const code = creep.transfer(to, resourceType, give);
            if (code === ERR_NOT_IN_RANGE) {
                creep.moveTo(to);
                return false;
            }
            if (code === OK) {
                amount -= give;
                (task as any).amount = amount;
                task.updated = Game.time;
                if (amount <= 0) return true;
            }
            return false;
        }
 
        TaskSystem.fail(roomName, task.id, 5);
        return true;
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
            removeRoomTasks(creep.room.name, t => t.type === 'fillExtension');
        }
    },

    fillTowers: function(creep, tasks) {
        const roomName = creep.room.name;
        const nextTask = tasks.find((t: any) => t && t.type === 'fillTower');
        const targetId = nextTask && (nextTask as any).id;
        if (targetId) {
            const tower = Game.getObjectById(targetId) as StructureTower | null;
            if (!tower) {
                removeRoomTasks(roomName, t => t.type === 'fillTower' && (t as any).id === targetId);
                return;
            }
            if (tower.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
                removeRoomTasks(roomName, t => t.type === 'fillTower' && (t as any).id === targetId);
                return;
            }
            if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(tower, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }

        const towers = creep.room.find(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 200
        });

        if (towers.length > 0) {
            const closest = creep.pos.findClosestByRange(towers);
            if (closest && creep.transfer(closest, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffffff' } });
            }
            return;
        }
        removeRoomTasks(roomName, t => t.type === 'fillTower');
    }
};  

export default roleManager;
