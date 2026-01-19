var roleNewtransferer = {
    // 初始化或更新状态
    initOrUpdateState: function(creep) {
        if (!creep.memory.state) {
            creep.memory.state = 'RETURN_TO_SOURCE'; // 假设开始时总是返回源房间
        }
    },

    // 从容器中提取能量
    withdrawEnergy: function(creep) {
        var targetContainer = null;
        var containers = creep.room.container;
        
        // Generic Logic: Use workLoc or find closest container
        if (containers.length > 0) {
            // Check bounds for workLoc
            if (creep.memory.workLoc !== undefined && containers[creep.memory.workLoc]) {
                targetContainer = containers[creep.memory.workLoc];
            } else {
                targetContainer = creep.pos.findClosestByRange(containers);
            }
            
            if (targetContainer) {
                if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.state = 'TRANSFER_ENERGY';
        }
    },

    // 转移能量到Storage
    transferEnergy: function(creep) {
        // Dynamic Link Logic
        // Check if there is a configured link in memory
        const linkId = creep.memory.targetLinkId || Memory.rooms[creep.room.name]?.centerLinkId;
        const link = linkId ? Game.getObjectById(linkId) : null;
        
        if (link && link.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
             if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(link, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            if (creep.store[RESOURCE_ENERGY] === 0) {
                creep.memory.state = 'RETURN_TO_SOURCE';
            }
        } else {
            // Fallback to Storage
            var targets = creep.room.storage;
            if (targets) {
                if (creep.transfer(targets, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
                }
                if (creep.store[RESOURCE_ENERGY] === 0) {
                    creep.memory.state = 'RETURN_TO_SOURCE';
                }
            } else {
                // If no storage, maybe terminal or spawn/extension?
                // For a transferer, usually storage is the hub.
                // If nothing, idle.
            }
        }
    },

    // 修复脚下的道路
    repairRoad: function(creep) {
        var road = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
        if (road && road.hits < road.hitsMax) {
            creep.repair(road);
        } else {
            // Only create construction site if we are sure? 
            // Creating sites automatically can be spammy. 
            // Commenting out for generic bot safety unless explicitly enabled.
            // var result = Game.rooms[creep.room.name].createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_ROAD);  
        }
    },

    // 主运行函数
    run: function(creep) {
        this.initOrUpdateState(creep);
        // 根据当前状态执行操作
        const sourceRoomName = creep.memory.sourceRoomName;
        const targetRoomName = creep.memory.targetRoomName;
        
        // Safety check for room names
        if (!sourceRoomName || !targetRoomName) return;

        switch (creep.memory.state) {
            case 'RETURN_TO_SOURCE':
                if (creep.room.name !== sourceRoomName) {
                    creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
                    return;
                } else {
                    this.withdrawEnergy(creep);
                }
                break;
            case 'TRANSFER_ENERGY':
                if (creep.room.name !== targetRoomName) {
                    this.repairRoad(creep);
                    // 如果不在目标房间，移动到目标房间的中心
                    creep.moveTo(new RoomPosition(25, 25, targetRoomName), { visualizePathStyle: { stroke: '#00aaff' } });
                    return;
                } else {
                    this.transferEnergy(creep);
                }
                break;
        }
    }
};

export default roleNewtransferer;
