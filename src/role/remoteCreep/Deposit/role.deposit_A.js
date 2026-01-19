var roledeposit_A = {

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
        if (creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {  
            creep.memory.harvesting = false;  
        }  
        if (!creep.memory.harvesting && creep.store[RESOURCE_MIST] === 0 ) {  
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
            if(deposits){
                creep.memory.targetDeposit = deposits[creep.memory.workLoc].id;
            }
        } else {
            creep.memory.prepare = true;
        }
        creep.memory.prepare = true;
        return true;
    },

    // source阶段
    source: function(creep, targetDeposit) {
        creep.memory.dontPullMe = true;  
        var harvestResult = creep.harvest(targetDeposit);
        if (harvestResult === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetDeposit, { visualizePathStyle: { stroke: '#ffaa00' } });
        } else {
            const enemiesInRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 2);
            if (enemiesInRange.length > 0) {
                // 如果有多个敌人，取最近的一个（虽然在这个范围内应该只有一个）
                const closestEnemy = findClosestTarget(creep, enemiesInRange)
                var attackResult = creep.attack(closestEnemy);
                // if (attackResult === ERR_NOT_IN_RANGE) {
                //     creep.moveTo(closestEnemy);
                // }
            }
        }
        return true;
    },

    // 工作阶段
    work: function(creep) {
        creep.memory.dontPullMe = true;  
        const targets = creep.pos.findInRange(FIND_MY_CREEPS, 3, {
            filter: (c) => c.carryCapacity - _.sum(c.carry) > 0 && c.memory.role !== creep.memory.role // 避免传输给自己同类型的creep
        });
        if( targets.length > 0){
            const target = findClosestTarget(creep, targets);
            const transferResult = creep.transfer(target, RESOURCE_MIST);
            // const storage = creep.room.storage;
            // if(creep.transfer(storage, RESOURCE_MIST) === ERR_NOT_IN_RANGE) {
            //     creep.moveTo(storage, {visualizePathStyle: {stroke: '#00ffff'}});
            // }
            // if (transferResult === ERR_NOT_IN_RANGE) {
            //     creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            //     // 目标无效，可能是因为掉落物已经被其他creep捡起
            //     // 可以忽略这个错误，因为在下一次循环中我们会再次检查
            // }
        }
        return true;
    },
};

function findClosestTarget(creep, targets) {  
    let closest = targets[0];  
    let minDistance = creep.pos.getRangeTo(closest);  
    for (let i = 1; i < targets.length; i++) {  
        let distance = creep.pos.getRangeTo(targets[i]);  
        if (distance < minDistance) {  
            closest = targets[i];  
            minDistance = distance;  
        }  
    }  
    return closest;  
}  
export default roledeposit_A