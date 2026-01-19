var rolepower_C = {

    // 主运行函数
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        
        // 初始化准备阶段
        if (creep.memory.prepare === undefined) {
            creep.memory.prepare = false;
        }

        // 处理准备阶段
        if (!creep.memory.prepare) {
            if (!this.prepare(creep, tasksList)) return 0;
        } else {
            const targetPowerBank = creep.room[creep.memory.targetPowerBank];
            // if ( targetPowerBank ) {
            //     this.toggleState(creep);
            //     if (creep.memory.state === 'harvesting') {
            //         this.source(creep);  // 采集能量
            //     } else if (creep.memory.state === 'defensive') {
            //         this.work(creep);  // 工作
            //     }
            // } 
            this.toggleState(creep);
            if (creep.memory.state === 'harvesting') {
                this.source(creep);  // 采集能量
            } else if (creep.memory.state === 'defensive') {
                this.work(creep);  // 工作
            }
            // else {
            //     creep.suicide();  // 如果找不到兄弟creep，直接自杀
            // }
        }
    },

    // 切换状态：根据是否有资源切换为采集或工作
    toggleState: function(creep) {
        creep.memory.state = creep.store[RESOURCE_POWER] === 0 ? 'harvesting' : 'defensive';
    },

    // 准备阶段
    prepare: function(creep, tasksList) {
        creep.memory.dontPullMe = false;

        if (creep.room.name !== creep.memory.sourceRoomName) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });
            return;
        }

        const task = tasksList.find(task => task.type === 'Power' && task.room === creep.memory.sourceRoomName);
        const targetPowerBank = task ? Game.getObjectById(task.id) : null;

        // 如果没有设置目标PowerBank，检查是否有掉落的Power资源
        if (creep.memory.targetPowerBank === undefined) {
            const powerResource = this.findDroppedPowerResource(creep.room);
            if (targetPowerBank) {
                creep.memory.targetPowerBank = task.id;
            } else if (powerResource) {
                creep.memory.prepare = true;
            } else {
                creep.suicide();
            }
        } else {
            creep.memory.prepare = true;
        }

        return true;
    },

    // 查找掉落的Power资源
    findDroppedPowerResource: function(room) {
        const droppedResources = room.find(FIND_DROPPED_RESOURCES);
        return droppedResources.find(resource => resource.resourceType === RESOURCE_POWER);
    },

    // 采集阶段
    source: function(creep) {
        creep.memory.dontPullMe = true;

        if (creep.room.name !== creep.memory.sourceRoomName) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        }

        const targetPowerBank = Game.getObjectById(creep.memory.targetPowerBank);
        const powerResource = this.findDroppedPowerResource(creep.room);
        const ruins = creep.room.find(FIND_RUINS);

        // 如果没有Power资源，优先从废墟中提取
        if (creep.store[RESOURCE_POWER] === 0) {
            if (ruins.length > 0) {
                this.withdrawFromRuins(creep, ruins[0]);
            } else if (powerResource) {
                this.pickupPowerResource(creep, powerResource);
            } else {
                this.moveToPowerBank(creep, targetPowerBank);
            }
        }
    },

    // 从废墟中提取资源
    withdrawFromRuins: function(creep, ruin) {
        if (creep.withdraw(ruin, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
            creep.moveTo(ruin, { visualizePathStyle: { stroke: '#00ff00' } });
        }
    },

    // 拾取掉落的Power资源
    pickupPowerResource: function(creep, resource) {
        if (creep.pickup(resource) === ERR_NOT_IN_RANGE) {
            creep.moveTo(resource, { visualizePathStyle: { stroke: '#0000ff' } });
        }
    },

    // 移动到PowerBank并采集
    moveToPowerBank: function(creep, targetPowerBank) {
        if (!creep.pos.inRangeTo(targetPowerBank, 4)) {
            creep.moveTo(targetPowerBank, { visualizePathStyle: { stroke: '#00ff00' } });
        }
        // 清空非Power资源
        for (let resourceType in creep.store) {
            if (resourceType !== RESOURCE_POWER && creep.store[resourceType] > 0) {
                creep.drop(resourceType);
            }
        }
    },

    // 工作阶段：将Power资源转移到目标存储
    work: function(creep) {
        creep.memory.dontPullMe = true;

        if (creep.room.name !== creep.memory.targetRoomName) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });
            return;
        }

        //const storage = creep.room.storage;
        const terminal = creep.room.terminal;
        const result = creep.transfer(terminal, RESOURCE_POWER);
        
        if (result === OK) {
            creep.suicide();
        } else if (result === ERR_NOT_IN_RANGE) {
            creep.moveTo(terminal, { visualizePathStyle: { stroke: '#00ffff' } });
        }
    }
};

export default rolepower_C;
