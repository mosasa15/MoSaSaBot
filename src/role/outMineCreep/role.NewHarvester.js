var roleNewHarvester = {

    // 主运行函数
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;

        if (!this.prepare(creep)) return; // 准备阶段
        this.toggleState(creep);  
        if (creep.memory.harvesting) {
            const targetSource = creep.room[creep.memory.targetSource];
            this.source(creep, tasksList, targetSource); // 采集能量
        } else{
            this.work(creep, tasksList); // 工作
        }
    },

    // // 修复脚下的道路
    // repairRoad: function(creep) {
    //     var road = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
    //     if (road && road.hits < road.hitsMax) {
    //         creep.repair(road);
    //     } else {
    //         var result = Game.rooms[creep.room.name].createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_ROAD);  
    //         if (result === OK) {  
    //             console.log(`${creep.name} 已创建一条路在 ${creep.pos}`);  
    //         }  
    //     }
    // },

    toggleState: function(creep) {  
        if (creep.memory.harvesting && creep.store.getFreeCapacity() == 0) {  
            creep.memory.harvesting = false;  
        }  
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] == 0 ) {  
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
        if(creep.memory.targetSource === undefined){
            const sources = creep.room.source;
            creep.memory.targetSource = sources[creep.memory.workLoc].id;
        }
        if(creep.memory.hasConstructionSites !== false ){
            if (creep.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
                creep.memory.hasConstructionSites = false; // 检查房间内是否有工地，没有的话这辈子就再也不检查了
            } else {
                creep.memory.hasConstructionSites = true;
            }
        }
        
        return true;
    },

    // source阶段
    source: function(creep, tasksList, targetSource) {
        creep.memory.dontPullMe = true;  
        if (creep.hits < creep.hitsMax  && !tasksList.some(task => task.type === 'delaySpawn' && task.details.some(detail => detail.room === creep.memory.sourceRoomName) ) ) {
            creep.say('我要凉了?');
            tasksList.push({             // 暂时禁止重生
                type:'delaySpawn',
                details: [
                    {
                        triggerTime: Game.time + 1500,
                        room: creep.memory.sourceRoomName,
                    }
                ]
            });
        }
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            if(targetSource.energy > 0){
                var harvestResult = creep.harvest(targetSource);
                if (harvestResult === OK) {
                    if (targetSource.energyCapacity === 1500 && !tasksList.some(task => task.type === 'SpawnReserveController' && task.room === creep.memory.sourceRoomName)) {
                        tasksList.push({        // 发布预订者
                            type:'SpawnReserveController',
                            room: creep.memory.sourceRoomName
                        })
                    }
                } else if (harvestResult === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                } else if (harvestResult === ERR_NOT_OWNER && !tasksList.some(task => task.type === 'clearCore' && task.room === creep.memory.sourceRoomName) && !tasksList.some(task => task.type === 'SpawnReserveController' && task.room === creep.memory.sourceRoomName)) {
                    tasksList.push({
                        type:'clearCore',
                        room: creep.memory.sourceRoomName
                    }),
                    tasksList.push({        // 发布预订者
                        type:'SpawnReserveController',
                        room: creep.memory.sourceRoomName
                    })
                }
            }
        }
        return true;
    },

    // 工作阶段
    work: function(creep, tasksList) {
        creep.memory.dontPullMe = true;  
        if (creep.hits < creep.hitsMax && !tasksList.some(task => task.type === 'delaySpawn' && task.details.some(detail => detail.room === creep.memory.sourceRoomName) ) ) {
            creep.say('我要凉了?');
            tasksList.push({             // 暂时禁止重生
                type:'delaySpawn',
                details: [
                    {
                        triggerTime: Game.time + 1500,
                        room: creep.memory.sourceRoomName,
                    }
                ]
            });
        }
        const containers = creep.room.container;
        const container = containers[creep.memory.workLoc];
        if(container){
            if (container.hits < container.hitsMax * 0.8) { 
                if(creep.pos.x !== container.pos.x && creep.pos.y !== container.pos.y){
                    creep.moveTo(container);
                }
                if (creep.repair(container) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });  
                }  
            } else {
                if(container.store.getFreeCapacity(RESOURCE_ENERGY) > 800) {
                    if(creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(container, {visualizePathStyle: {stroke: '#ffffff'}});
                    }  
                } else if(creep.memory.hasConstructionSites === true ){
                    var targets = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位  
                    if (targets.length > 0) {  
                        var closestTarget = findClosestTarget(creep, targets);  
                        if (creep.build(closestTarget) == ERR_NOT_IN_RANGE) {  
                            creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}}); // 绘制路径并前往最近的建筑位  
                        }  
                        if (creep.build(closestTarget) == OK ){
                            creep.room.update();
                        }
                    }
                } 
            }
        } else {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位  
            if (targets.length > 0) {  
                var closestTarget = findClosestTarget(creep, targets);  
                if (creep.build(closestTarget) == ERR_NOT_IN_RANGE) {  
                    creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}}); // 绘制路径并前往最近的建筑位  
                }  
                if (creep.build(closestTarget) == OK ){
                    creep.room.update();
                }
            }
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
export default roleNewHarvester;