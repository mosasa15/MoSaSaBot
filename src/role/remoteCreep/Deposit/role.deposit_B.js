var roledeposit_B = {

    // 主运行函数
    run: function(creep) {
        // const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        if (creep.memory.prepare === undefined) {  
            creep.memory.prepare = false;  
        } 
        if(creep.memory.prepare === false){
            if (!this.prepare(creep)) return; // 准备阶段
        } 
        this.toggleState(creep);  
        if (creep.memory.harvesting) {
            const targetDeposit = creep.room[creep.memory.targetDeposit];
            this.source(creep, targetDeposit); // 采集能量
        } else{
            this.work(creep); // 工作
        }
    },

    toggleState: function(creep) {  
        if (creep.memory.harvesting && (creep.store.getFreeCapacity() == 0) || creep.ticksToLive < 300) {  
            creep.memory.harvesting = false;  
        }  
        if (!creep.memory.harvesting && creep.store[RESOURCE_MIST] === 0) {  
            creep.memory.harvesting = true;  
        }  
    },  

    // 准备阶段
    prepare: function(creep) {
        creep.memory.dontPullMe = false;  
        if (creep.room.name !== creep.memory.sourceRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });  
            return;  
        }  
        if(creep.memory.targetDeposit === undefined){
            const deposits = creep.room.deposit;
            if(deposits[creep.memory.workLoc]){
                creep.memory.targetDeposit = deposits[creep.memory.workLoc].id;
            } else {
                creep.memory.targetDeposit = null;
                creep.say('💤')
            }
        } else {
            creep.memory.prepare = true;
        }
        return true;
    },

    // source阶段
    source: function(creep, targetDeposit) {
        creep.memory.dontPullMe = true;  
        if (creep.room.name !== creep.memory.sourceRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });  
            return;  
        } else {

            const tombstones = creep.room.find(FIND_TOMBSTONES);
            // 遍历每一个墓碑
            if(tombstones.length > 0){
                for (const tombstone of tombstones) {
                    // 检查墓碑中是否包含MIST资源
                    if (tombstone.store.getUsedCapacity(RESOURCE_MIST) > 0) {
                        const pickupResult = creep.withdraw(tombstone, RESOURCE_MIST);
                        if(pickupResult === ERR_NOT_IN_RANGE){
                            creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#00ff00' } });
                        }
                    }
                }
            } 
            const targets = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
                filter: (c) => c.carryCapacity - _.sum(c.carry) <= 0 && c.memory.role !== creep.memory.role
            });
            if(targets.length > 0){
                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#00ff00' } });
            } else {
                if (!creep.pos.inRangeTo(targetDeposit, 2)) { 
                    creep.moveTo(targetDeposit, { visualizePathStyle: { stroke: '#00ff00' } });
                } 
            }
        }
        return true;
    },

    // 工作阶段
    work: function(creep) {
        creep.memory.dontPullMe = false;  
        if (creep.room.name !== creep.memory.targetRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });  
            return;  
        } else {
            // const terminal = creep.room.terminal;
            const storage = creep.room.storage;
            const result = creep.transfer(storage, RESOURCE_MIST);
            if(result === OK && creep.ticksToLive < 200){
                creep.suicide();
            }
            if( result === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#00ffff'}});
            }
        }
        return true;
    },
};

export default roledeposit_B