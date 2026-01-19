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
        if (containers.length > 0) {
            if(creep.memory.sourceRoomName === 'E55N13'){
                targetContainer = containers[0];
            } else{
                targetContainer = containers[creep.memory.workLoc];
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
        if(creep.memory.targetRoomName === 'E54N19' && creep.memory.sourceRoomName === 'E54N18'){
            const link = creep.room['66bcffdf5302fa689e506b9c'];
            if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(link, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            if (creep.store[RESOURCE_ENERGY] === 0) {
                creep.memory.state = 'RETURN_TO_SOURCE';
            }
        } else if(creep.memory.targetRoomName === 'E56N13' && creep.memory.sourceRoomName === 'E57N13'){
            const link = creep.room['66cd935ddb9e570ef3e81c37'];
            if (creep.transfer(link, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(link, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            if (creep.store[RESOURCE_ENERGY] === 0) {
                creep.memory.state = 'RETURN_TO_SOURCE';
            }
        } else {
            var targets = creep.room.storage;
            if (creep.transfer(targets, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
            }
            if (creep.store[RESOURCE_ENERGY] === 0) {
                creep.memory.state = 'RETURN_TO_SOURCE';
            }
        }
    },

    // 修复脚下的道路
    repairRoad: function(creep) {
        var road = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
        if (road && road.hits < road.hitsMax) {
            creep.repair(road);
        } else {
            var result = Game.rooms[creep.room.name].createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_ROAD);  
            if (result === OK) {  
                console.log(`${creep.name} 已创建一条路在 ${creep.pos}`);  
            }  
        }
    },

    // 主运行函数
    run: function(creep) {
        this.initOrUpdateState(creep);
        // 根据当前状态执行操作
        const sourceRoomName = creep.memory.sourceRoomName;
        const targetRoomName = creep.memory.targetRoomName;
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