var roleNewHarvester = {
    // 准备阶段
    prepare: function(creep) {
        if (creep.room.name !== creep.memory.sourceRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });  
            return;  
        }  
        if(creep.memory.targetSource === undefined){
            const sources = creep.room.source;
            creep.memory.targetSource = sources[creep.memory.workLoc].id;
        }
        if (creep.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
            creep.memory.hasConstructionSites = false; // 检查房间内是否有工地，没有的话这辈子就再也不检查了
        } else {
            creep.memory.hasConstructionSites = true;
        }
        return true;
    },

    
    // source阶段
    source: function(creep, tasksList, targetSource) {
        if (creep.hits < creep.hitsMax  && !tasksList.some(task => task.type === 'delaySpawn' && task.details.some(detail => detail.room === creep.memory.sourceRoomName) ) ) {
            creep.say('我要凉了');
            tasksList.push({             // 暂时禁止重生
                type:'delaySpawn',
                details: [
                    {
                        triggerTime: Game.time + 50,
                        room: creep.memory.sourceRoomName,
                    }
                ]
            });
        }
        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            const harvestResult = creep.harvest(targetSource);
            if (harvestResult === OK) {
                if (targetSource.energyCapacity === 1500 && !tasksList.some(task => task.type === 'SpawnReserveController' && task.room === creep.memory.sourceRoomName)) {
                    tasksList.push({        // 发布预订者
                        type:'SpawnReserveController',
                        room: creep.memory.sourceRoomName
                    })
                }
            } else if (harvestResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
            } else if (harvestResult === ERR_NOT_OWNER && !tasksList.some(task => task.type === 'clearCore' && task.room === creep.memory.sourceRoomName)) {
                tasksList.push({
                    type:'clearCore',
                    room: creep.memory.sourceRoomName
                })
            }
        }
        return true;
    },

    // 工作阶段
    work: function(creep, tasksList) {
        if (creep.hits < creep.hitsMax && !tasksList.some(task => task.type === 'delaySpawn' && task.details.some(detail => detail.room === creep.memory.sourceRoomName) ) ) {
            creep.say('我要凉了');
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
            if (container.hits < container.hitsMax) {  
                if (creep.repair(container) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });  
                }  
            } else {
                if(container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    creep.transfer(container, RESOURCE_ENERGY);  
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
        }
        return true;
    },

    // 主运行函数
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetSource].tasks;
        if (!this.prepare(creep)) return; // 准备阶段
        if (creep.store.getFreeCapacity() > 0) {
            const targetSource = creep.room[creep.memory.targetSource];
            this.source(creep, tasksList, targetSource); // 采集能量
        } else {
            this.work(creep, tasksList); // 工作
        }
    }
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
var observer = {  
    /**  
     * 根据Link的职责执行相应的操作  
     * @param {StructureLink} link - 当前操作的Link对象  
     */  
    run: function( roomName ) {  
        // 获取当前房间的内存 
        const powerRooms = ['E51N20','E52N20','E53N20','E54N20','E55N20','E56N20','E57N20','E58N20','E59N20',]; 
        // const powerRooms = ['E50N16']; 
        const tasksList = Memory.rooms[roomName].tasks;  
        const roomMemory = Memory.rooms[roomName].cross; 
        if(!roomMemory){
            Memory.rooms[roomName].cross = {}
            Memory.rooms[roomName].cross.Index = 0;
        }
        let Index = Memory.rooms[roomName].cross.Index || 0;  // 初始化或获取当前观察房间的索引
        //==============================================================================================
        
        if (Game.time % 10 === 0) {
            const roomNameToObserve = powerRooms[Index];
            const observer = Game.rooms[roomName].observer;
            if (observer) {
                observer.observeRoom(roomNameToObserve);
                // 在 Memory 中存储需要检查的房间，以便在下一个 tick 检查
                Memory.rooms[roomName].cross.checkRoom = roomNameToObserve;
                // 更新索引
                Index = (Index + 1) % powerRooms.length;
                Memory.rooms[roomName].cross.Index = Index
            }
        }
        const flag = Game.flags['Power'];
        if( flag ){
            if (!tasksList.some(task => task.type === 'Power' &&  task.room === flag.pos.roomName ) ) {
                tasksList.push({          
                    type:'Power',
                    room: flag.pos.roomName
                });
            }
        }
        if (roomMemory.checkRoom) {
            const observedRoomName = Memory.rooms[roomName].cross.checkRoom;
            const observedRoom = Game.rooms[observedRoomName];
            if (observedRoom) {
                const powerBanks = observedRoom.powerBank;
                if (powerBanks.length > 0) {
                    const terrain = new Room.Terrain(observedRoom.name);
                    const pos = powerBanks.pos;
                    let num = 0;
                    [
                        [pos.x-1,pos.y-1],[pos.x, pos.y-1],[pos.x+1, pos.y-1],
                        [pos.x-1,pos.y],[pos.x+1, pos.y],
                        [pos.x-1,pos.y+1],[pos.x, pos.y+1],[pos.x+1, pos.y+1],
                    ].forEach((p) => {
                        if (terrain.get(p[0], p[1]) !== TERRAIN_MASK_WALL) num++;
                    });
                    num = Math.main(num, 3);

                    console.log(`大眼睛在房间 ${observedRoom} 发现PB`);
                    if (!tasksList.some(task => task.type === 'Power' &&  task.room === observedRoom.name ) ) {
                        tasksList.push({          
                            type:'Power',
                            room: observedRoom.name,
                            number: num
                        });
                    }
                } else {
                    console.log(`大眼睛在房间 ${observedRoom} 没有发现PB`);
                }
            }
            // 清除 toCheckThisTick 标志，因为已经检查过了
            delete Memory.rooms[roomName].cross.checkRoom;
        }
        //===============================================================================================
    },  
}; 

const resourceCompoundMap = {  
    // 三级化合物  
    ['XGH2O']: ['GH2O', 'X'],              // GH系列三级化合物
    ['XLHO2']: ['LHO2', 'X'],              // LO系列三级化合物
    ['XLH2O']: ['LH2O', 'X'],              // LO系列三级化合物
    ['XZH2O']: ['ZH2O', 'X'],              // ZH系列三级化合物
    ['XZHO2']: ['ZHO2', 'X'],              // ZO系列三级化合物
    ['XGHO2']: ['GHO2', 'X'],              // GO系列三级化合物
    ['XUH2O']: ['UH2O', 'X'],              // UH系列三级化合物
    ['XUHO2']: ['UHO2', 'X'],              // UO系列三级化合物
    ['XKH2O']: ['KH2O', 'X'],              // KH系列三级化合物
    ['XKHO2']: ['KHO2', 'X'],              // KO系列三级化合物

    // 二级化合物  
    ['GH2O']: ['GH', 'OH'],                // GH系列二级化合物
    ['LHO2']: ['LO', 'OH'],                // LH系列二级化合物
    ['LH2O']: ['LH', 'OH'],                // LH系列二级化合物
    ['ZH2O']: ['ZH', 'OH'],                // ZH系列二级化合物
    ['ZHO2']: ['ZO', 'OH'],                // ZO系列二级化合物
    ['GHO2']: ['GO', 'OH'],                // GO系列二级化合物
    ['UH2O']: ['UH', 'OH'],                // UH系列二级化合物
    ['UHO2']: ['UO', 'OH'],                // UO系列二级化合物
    ['KH2O']: ['KH', 'OH'],                // KH系列二级化合物
    ['KHO2']: ['KO', 'OH'],                // KO系列二级化合物

    // 一级化合物  
    ['GH']: ['G', 'H'],                    // GH系列一级化合物
    ['LO']: ['L', 'O'],                    // LO系列一级化合物
    ['LH']: ['L', 'H'],                    // LH系列一级化合物
    ['ZH']: ['Z', 'H'],                    // ZH系列一级化合物
    ['ZO']: ['Z', 'O'],                    // ZO系列一级化合物
    ['UH']: ['U', 'H'],                    // UH系列一级化合物
    ['UO']: ['U', 'O'],                    // UO系列一级化合物
    ['KH']: ['K', 'H'],                    // KH系列一级化合物
    ['KO']: ['K', 'O'],                    // KO系列一级化合物

    // 基础化合物  
    ['OH']: ['H', 'O'],                    // 基础化合物
    ['ZK']: ['Z', 'K'],                    // 基础化合物
    ['UL']: ['U', 'L'],                    // 基础化合物
    ['G']:  ['ZK', 'UL'],                   // 基础化合物
};  
const labTarget = [
    // 基础
    { target: 'OH', number: 60000 },           // 基础化合物
    { target: 'ZK', number: 10000 },
    { target: 'UL', number: 10000 },
    { target: 'G', number: 10000 },

    // XLHO2 生产线，强化 治疗
    { target: 'LO', number: 10000  },               // 一级
    { target: 'LHO2', number: 10000 },             // 二级
    { target: 'XLHO2', number: 10000 },            // 三级
    // XLH2O 生产线，强化 维修
    { target: 'LH', number: 30000 },           // 一级
    { target: 'LH2O', number: 30000 },         // 二级
    { target: 'XLH2O', number: 30000 },        // 三级
    // XZHO2 生产线，强化 移动
    { target: 'ZO', number: 10000 },           // 一级
    { target: 'ZHO2', number: 10000 },         // 二级
    { target: 'XZHO2', number: 10000 },        // 三级
    // XZH2O 生产线，强化 攻击
    { target: 'ZH', number: 10000 },           // 一级
    { target: 'ZH2O', number: 10000 },         // 二级
    { target: 'XZH2O', number: 10000 },        // 三级
    // XUH2O 生产线，强化 攻击
    { target: 'UH', number: 20000 },           // 一级
    { target: 'UH2O', number: 20000 },         // 二级
    { target: 'XUH2O', number: 20000 },        // 三级
    // XKHO2 生产线，强化 防御
    { target: 'KH', number: 15000 },           // 一级
    { target: 'KH2O', number: 15000 },         // 二级
    { target: 'XKH2O', number: 15000 },        // 三级
    // XUHO2 生产线，强化 防御
    { target: 'UO', number: 15000 },           // 一级
    { target: 'UHO2', number: 15000 },         // 二级
    { target: 'XUHO2', number: 15000 },        // 三级
    // XGH2O 生产线，强化 升级
    { target: 'GH', number: 10000 },           // 一级
    { target: 'GH2O', number: 10000 },         // 二级
    { target: 'XGH2O', number: 10000 },        // 三级
    // XGHO2 生产线，强化 抗击
    { target: 'GO', number: 10000 },           // 一级
    { target: 'GHO2', number: 10000 },         // 二级
    { target: 'XGHO2', number: 10000 },        // 三级
];
Game.getObjectById('670bf99141de2b800c4c9fd9').launchNuke(new RoomPosition(28,18, 'E48N11'));
[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK]
Game.rooms['E54N19'].terminal.send(RESOURCE_HYDROGEN, 50000, 'E55N21', '是的，这是一份礼物 ');
Game.rooms['E56N13'].terminal.send('K', 88752, 'E49N19', '是的，这是一份礼物 ');
Game.rooms['E54N19'].terminal.send(RESOURCE_POWER, 26089, 'E58N15', '是的，这是一份礼物 ');

Game.rooms['E58N14'].terminal.send('XLH2O', 56000, 'E5&N15', '是的，这是一份礼物 ');
const cost = Game.market.calcTransactionCost(1000, 'E56N13', 'E52N4');
console.log(cost);

Game.market.deal('67a5ee72b2fb380012539510', 1);

Game.market.createOrder({  
    type: ORDER_BUY,  
    resourceType: CPU_UNLOCK,  
    price: 0.001,  
    totalAmount: 1,  
    //roomName: 'E55N11',
});  
var roleNewHarvester = {  
    /**  
     * @param {Creep} creep The creep instance to run.  
     */  
    run: function(creep) {  
        const sourceRoomName = creep.memory.sourceRoomName;  
        const targetRoomName = creep.memory.targetRoomName;  
        const containers = creep.room.container;
        const SOURCE_RANGE = 1;  
        // 如果不在源房间，则移动到源房间  
        // console.log(containers)
        const sources = creep.room.source;  
        let targetsource = null;  
        if (creep.room.name !== sourceRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });  
            return;  
        }  
        if (sources.length > 0) {  
            if (creep.memory.workLoc === 0 && sources[0]) {  
                targetsource = sources[0];  
            } else if (creep.memory.workLoc === 1 && sources[1]) {  
                targetsource = sources[1];  
            }  
        }  
        const container = findContainerNearSource(targetsource, SOURCE_RANGE);  
        // 如果背包中有能量且容器需要修理  
        if (creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0 && container.hits < container.hitsMax) {  
            if (creep.repair(container) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
        } else {  
            // 如果creep不在容器旁边，移动到容器  
            if (!creep.pos.isEqualTo(container.pos)) {  
                creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });  
            } else {  
                // 如果creep在容器旁边，根据条件执行操作  
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {  
                    if (creep.harvest(targetsource) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(targetsource, { visualizePathStyle: { stroke: '#ffaa00' } });  
                    }  
                } else if (container.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {  
                    creep.transfer(container, RESOURCE_ENERGY);  
                }  else {
                    var targets = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位  
                    if (targets.length) {  
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
        }  
    }  
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

function findContainerNearSource(source, range) {  
    return source.room.find(FIND_STRUCTURES, {  
        filter: (structure) => {  
            return (structure.structureType === STRUCTURE_CONTAINER) &&  
                    (structure.pos.getRangeTo(source.pos) <= range);  
        }  
    })[0];  
}  


var roleScavenger = {  

    /**  
     * @param {Creep} creep  
     */  
    run: function(creep) {  
        const targetRoomName = creep.memory.targetRoomName;  
        const sourceRoomName = creep.memory.sourceRoomName;  
        const rampartIdToDismantle = '660d52ae21d89abd2c5fe492';
        const tasksList = Memory.rooms[targetRoomName].tasks;
        const labs = creep.room.lab;
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  

        if(creep.memory.boosted === false){
            var targetLab = labs[2]; 
            const result = targetLab.boostCreep(creep);  
            if (result === OK) { 
                creep.memory.boosted = true;
            } else if (result === ERR_NOT_IN_RANGE) {  
                creep.moveTo(targetLab, { visualizePathStyle: { stroke: '#0000ff' } });  
            } else if (result === ERR_NOT_ENOUGH_RESOURCES && !tasksList.some(task => task.type === 'boostGetResource') && !tasksList.some(task => task.type === 'labGetEnergy')) {  
                // 如果资源不足，调用this.boostBodyParts来请求物资  
                this.boostBodyParts(creep, labs, tasksList);  
            }  
        } else {
            // 如果creep不在源房间，则移动到源房间
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(20, 25, sourceRoomName), { visualizePathStyle: { stroke: '#0000ff' } });
                return;
            }
            // 在源房间中，寻找特定ID的rampart
            var targetRampart = creep.room[rampartIdToDismantle];
            // 如果找到了rampart，并且它存在于源房间中，则拆除它
            if (targetRampart && targetRampart.room.name === sourceRoomName) {
                if (creep.dismantle(targetRampart) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetRampart, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            }
        }
    },


    boostBodyParts: function(creep, labs, tasksList) {  
        const workParts = creep.body.filter(part => part.type === WORK).length;  
        const totalCompound = workParts * 30;  
        const lab = labs[2];  
        const Compound = RESOURCE_ZYNTHIUM_HYDRIDE; 
        // 检查实验室是否有足够的RESOURCE
        if (lab.store[Compound] < totalCompound) {  
            console.log(`实验室 ${lab.id} 缺少 ${totalCompound - lab.store[Compound]} 单位的 ${Compound}，无法强化Creep的WORK部件。`);  
            tasksList.push({  
                type:'boostGetResource',  
                resource: [  
                    {  
                        id: lab.id,  
                        type: Compound,  
                        amount: totalCompound - lab.store[Compound]  
                    }  
                ]  
            });  
        }  
        // 检查实验室是否有足够的ENERGY  
        if (lab.store[RESOURCE_ENERGY] < 2000) {  
            console.log(`实验室 ${lab.id} 缺少ENERGY，无法强化Creep的WORK部件。`);  
            tasksList.push({
                type: 'labGetEnergy'
            });  
        }   
        return;  
    },
};  





var roleScavenger = {
    /**
     * @param {Creep} creep
     */
    run: function(creep) {
        const sourceRoomName = creep.memory.sourceRoomName;
        const rampartIdToDismantle = '62737dc00c3de01d7a1f79a1';
        const labs = creep.room.lab;
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        creep.memory.dontPullMe = false;

        if (creep.memory.boosted === undefined) {
            creep.memory.boosted = false;
        }

        if (!creep.memory.boosted) {
            var targetLab = labs[2];
            const result = targetLab.boostCreep(creep);
            if (result === OK) {
                creep.memory.boosted = true;
            } else if (result === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetLab, { visualizePathStyle: { stroke: '#0000ff' } });
            } else if (result === ERR_NOT_ENOUGH_RESOURCES && !tasksList.some(task => task.type === 'boostGetResource') && !tasksList.some(task => task.type === 'labGetEnergy')) {
                this.boostBodyParts(creep, labs, tasksList);
            }
        }

        if (creep.memory.boosted) {
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(20, 25, sourceRoomName), { visualizePathStyle: { stroke: '#0000ff' } });
                return;
            }
            // 在源房间中，寻找特定ID的rampart
            var targetRampart = creep.room[rampartIdToDismantle];
            // 如果找到了rampart，并且它存在于源房间中，则拆除它
            if (targetRampart && targetRampart.room.name === sourceRoomName) {
                if (targetRampart.hits === 10000) {
                    // 发送消息到邮箱
                    Game.notify(`烂命一条就是干，干！干！干！`);
                } else if (creep.dismantle(targetRampart) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetRampart, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            }
        }
    },

    boostBodyParts: function(creep, labs, tasksList) {
        const workParts = creep.body.filter(part => part.type === WORK).length;
        const totalCompound = workParts * 30;
        const lab = labs[2];
        const Compound = RESOURCE_ZYNTHIUM_HYDRIDE;

        // 检查实验室是否有足够的RESOURCE
        if (lab.store[Compound] < totalCompound) {
            console.log(`实验室 ${lab.id} 缺少${totalCompound - lab.store[Compound]} 单位的 ${Compound}，无法强化Creep的WORK部件。`);
            tasksList.push({
                type: 'boostGetResource',
                resource: [{
                    id: lab.id,
                    type: Compound,
                    amount: totalCompound - lab.store[Compound]
                }]
            });
        }

        // 检查实验室是否有足够的ENERGY
        if (lab.store[RESOURCE_ENERGY] < 2000) {
            console.log(`实验室 ${lab.id} 缺少ENERGY，无法强化Creep的WORK部件。`);
            tasksList.push({
                type: 'labGetEnergy'
            });
        }
        return;
    }
};


var roleTransferer = {  

    /** @param {Creep} creep **/  
    run: function(creep) {  
        // 如果正在转移且能量为0，则停止转移  
        if (creep.memory.transfering && creep.store[RESOURCE_ENERGY] === 0) {  
            creep.memory.transfering = false;  
            creep.say('😃下班了！好耶');  
        }  
        // 如果不在转移且容量已满，则开始转移  
        if (!creep.memory.transfering && (creep.store.getFreeCapacity() === 0 || creep.store[RESOURCE_HYDROGEN] >= creep.store.getCapacity() * 0.2) ) {  
            creep.memory.transfering = true;  
            creep.say('😟上班了！呜呜呜');  
        }  
        // 如果不在转移  
        if (!creep.memory.transfering) {  
            const containers = creep.room.container; 
            // 根据creep的workLoc找到对应的容器  
            if (containers.length > 0) {  
                let targetContainer = null;  
                if (creep.memory.workLoc === 0) {  
                    targetContainer = containers[0];  
                } else if (creep.memory.workLoc === 1) {  
                    targetContainer = containers[1];  
                } else if (creep.memory.workLoc === 2) {  
                    targetContainer = containers[0];  
                }  
                if (creep.memory.workLoc != 2) {  
                    if (creep.withdraw(targetContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffffff'}});  
                    }  
                } else {  
                    // 尝试提取氢  
                    if (creep.withdraw(targetContainer, RESOURCE_HYDROGEN) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffffff'}});  
                    }  
                }
            }  
        } else {  
            var targets = creep.room.storage;
            if (targets) { 
                if (creep.transfer(targets, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});  
                } else if(creep.transfer(targets, RESOURCE_HYDROGEN) === ERR_NOT_IN_RANGE){
                    creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});  
                }
            }
        }  
    }  
};  

var roleScavenger = {
    /**
     * @param {Creep} creep
     */
    run: function(creep) {
        const sourceRoomName = creep.memory.sourceRoomName; 
        creep.memory.dontPullMe = true;   
        if (creep.room.name !== sourceRoomName) {  
            creep.moveTo(new RoomPosition(20, 25, sourceRoomName), { visualizePathStyle: { stroke: '#0000ff' } });  
        } else {
            // 如果正在转移且能量为0，则停止转移  
            if (creep.memory.transfering && creep.store[RESOURCE_ENERGY] === 0) {  
                creep.memory.transfering = false;  
            }  
            // 如果不在转移且容量已满，则开始转移  
            if (!creep.memory.transfering && creep.store.getFreeCapacity() === 0) {  
                creep.memory.transfering = true;  
            }  
            // 如果不在转移  
            if (!creep.memory.transfering) {  
                const storage = creep.room.storage;
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                }   
            } else {  
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
                } 
            }  
        }
    }
};

// { room: 'E55N21', x: 46, y: 28 },  
// { room: 'E56N21', x: 21, y: 1 },  
// { room: 'E56N22', x: 31, y: 1 },  
// { room: 'E56N23', x: 48, y: 18 },  
// { room: 'E57N23', x: 7, y: 1 },
// { room: 'E57N24', x: 48, y: 15 },  
// { room: 'E58N24', x: 11, y: 1 },  
// { room: 'E58N25', x: 16, y: 1 },  
// { room: 'E58N26', x: 1, y: 39 },  
// { room: 'E57N26', x: 37, y: 1 },  


var roleScavenger = {
    /**
     * @param {Creep} creep
     */
    run: function(creep) {
        var sourceRoomName = creep.memory.sourceRoomName;  
        if (creep.room.name !== sourceRoomName) {  
            creep.moveTo(new RoomPosition(20, 25, sourceRoomName), { visualizePathStyle: { stroke: '#0000ff' } });  
            return;
        } else {
            if(creep.room.controller){
                if(creep.signController(creep.room.controller, '⚠️⚠️⚠️警告！此房间受MoSaSa保护，除玩家pat1m或路过以外，请远离此房间！⚠️⚠️⚠️') == ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.controller);
                }
            }
        }
    }
};

var roleNewbuilder = {  
    /**  
     * @param {Creep} creep 
     */  
    // 修复脚下的道路
    repairRoad: function(creep) {
        var road = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
        if (road && road.hits < road.hitsMax) {
            creep.repair(road);
        } 
        // else {
        //     var result = Game.rooms[creep.room.name].createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_ROAD);  
        //     if (result === OK) {  
        //         console.log(`${creep.name} 已创建一条路在 ${creep.pos}`);  
        //     }  
        // }
    },
    run: function(creep) {  
        const sourceRoomName = creep.memory.sourceRoomName;  
        const targetRoomName = creep.memory.targetRoomName;
        const towers = creep.room.tower;
        const storage = creep.room.storage;
        creep.memory.dontPullMe = true;  

        if (!creep.memory.state) {  
            creep.memory.state = 'harvesting';  
        }  
        
        if (creep.room.name !== sourceRoomName) {  
            const waypoints = [  
                { room: 'E56N13', x: 37, y: 48 },  
                { room: 'E56N12', x: 32, y: 48 },  
                { room: 'E56N11', x: 10, y: 42 },  
                { room: 'E56N10', x: 1, y: 15 },  
                { room: 'E55N10', x: 1, y: 19 },
                { room: 'E54N10', x: 1, y: 24 },  
                { room: 'E53N10', x: 27, y: 48 },  
                { room: 'E53N9', x: 45, y: 14 },  
                { room: 'E54N9', x: 48, y: 20 },  
                { room: 'E55N9', x: 19, y: 12 },  
            ];  
            // 当前的目标索引  
            let currentIndex = creep.memory.currentIndex || 0;  
            // 当前目标  
            const currentWaypoint = waypoints[currentIndex];  
            // 如果creep不在目标房间或目标坐标上，则移向该目标  
            if (creep.room.name !== currentWaypoint.room ||  
                (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined &&  
                !creep.pos.isEqualTo(currentWaypoint.x, currentWaypoint.y))) {  
                if (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined) {  
                    creep.moveTo(new RoomPosition(currentWaypoint.x, currentWaypoint.y, currentWaypoint.room), {  
                        visualizePathStyle: { stroke: '#ffaa00' }  
                    });  
                } else {  
                    creep.moveTo(new RoomPosition(25, 25, currentWaypoint.room), {  
                        visualizePathStyle: { stroke: '#ffaa00' }  
                    });  
                }  
                return; // 移动操作后退出函数  
            }  
        } 
        var targetSource = null;
        const sources = creep.room.source;  
        if (sources.length > 0) {  
            if (creep.memory.workLoc === 0 && sources[0]) {  
                targetSource = sources[0];  
            } else if (creep.memory.workLoc === 1 && sources[1]) {  
                targetSource = sources[1];  
            }  
        }

        if (creep.memory.state === 'harvesting') { 
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {  
                if (targetSource) {  
                    if (creep.harvest(targetSource, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(targetSource, {  
                            visualizePathStyle: { stroke: '#ffffff' }});  
                        }  
                    }  
                } else {  
                creep.memory.state = 'working';  
            }  
        } else if (creep.memory.state === 'working') {
            if(creep.memory.hasConstructionSites === undefined){
                // console.log('123')
                if (creep.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
                    creep.memory.hasConstructionSites = false; // 检查房间内是否有工地，没有的话这辈子就再也不检查了
                } else {
                    creep.memory.hasConstructionSites = true;
                }
            }
            if (creep.store[RESOURCE_ENERGY] > 0) {  
                if (creep.memory.hasConstructionSites) {  
                    var targets = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位  
                    var closestTarget = findClosestTarget(creep, targets);  
                    if (creep.build(closestTarget) == ERR_NOT_IN_RANGE) {  
                        creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}}); // 绘制路径并前往最近的建筑位  
                    }  
                    if (creep.build(closestTarget) == OK ){
                        creep.room.update();
                    }
                    if (creep.room.find(FIND_CONSTRUCTION_SITES).length === 0) {
                        creep.memory.hasConstructionSites = false; // 检查房间内是否有工地，没有的话这辈子就再也不检查了
                    }
                } else {
                    this.repairRoad(creep);
                    if(storage){
                        if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                            creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                        }
                    } else {
                        const targetTower = towers[0];
                        if ( targetTower && targetTower.store.energy < 600) {  
                            if (creep.transfer(targetTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                                creep.moveTo(targetTower, {visualizePathStyle: {stroke: '#ffffff'}});  
                            }  
                        } else if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
                            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
                        } 
                    }
                }
            } else {  
                creep.memory.state = 'harvesting';  
            }  
        } 
    }
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

var roleScavenger = {
    /**
     * @param {Creep} creep
     */
    run: function(creep) {
        const sourceRoomName = creep.memory.sourceRoomName; 
        creep.memory.dontPullMe = true;   
        if (creep.room.name !== sourceRoomName) {  
            creep.moveTo(new RoomPosition(20, 25, sourceRoomName), { visualizePathStyle: { stroke: '#0000ff' } });  
        } else {
            // 如果正在转移且能量为0，则停止转移  
            if (creep.memory.transfering && creep.store[RESOURCE_ENERGY] === 0) {  
                creep.memory.transfering = false;  
            }  
            // 如果不在转移且容量已满，则开始转移  
            if (!creep.memory.transfering && creep.store.getFreeCapacity() === 0) {  
                creep.memory.transfering = true;  
            }  
            // 如果不在转移  
            if (!creep.memory.transfering) {  
                const storage = creep.room.storage;
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                }   
            } else {  
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
                    creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
                } 
            }  
        }
    }
};
let orderCreated = false;  
/**  
 * 创建一个购买能源的订单  
 * 注意：此函数设计为在整个程序的运行周期内只创建一个订单。  
 */  
function createBuyOrderForEnergy() {  
    if (orderCreated) {  
        console.log('An order for energy has already been created.');  
        return;  
    }  
    const roomName = 'E54N19';  
    const amount = 1;
    const price = 100000000;  
    const orderId = 
    Game.market.createOrder({  
        type: ORDER_BUY,  
        resourceType: RESOURCE_CATALYZED_LEMERGIUM_ACID,  
        price: 400,  
        totalAmount: 50000,  
        roomName: 'E55N9' 
    });  
    if (orderId === -1) {  
        console.log('失败创建订单', roomName);  
    } else {  
        console.log('成功创建订单；', orderId, '在', roomName);  
        orderCreated = true; // 标记订单已创建  
    }  
    // 66f1cbc9a2344400120203e7
    Game.market.deal('6717dbd57c699e0012139d3b', 1);
}  
// 导出函数以便在其他文件中使用  
    // 遍历任务中的所有资源需求  
    for (let resource of fillLabsTask.resource) {  
        // 检查资源是否已完全转移（number 为 0）  
        if (resource.amount <= 0) continue;  
        // 尝试从存储中提取资源  
        let amountToWithdraw = Math.min(resource.amount, creep.store.getCapacity());
        let err = creep.withdraw(terminal, resource.type, amountToWithdraw);  
        if (err === ERR_NOT_IN_RANGE) {  
            creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffffff' } });  
        }  
        if (err === OK) {  
            resource.amount -= amountToWithdraw;
        } 
        // 如果从存储中提取资源成功 (在自身上限和资源上限取最小值)
        if (creep.store[resource.type] > 0) {  
            // 查找目标实验室 
            const targetLab = creep.room[resource.id];  
            if (targetLab) {  
                // 尝试将资源转移到实验室  
                let transferResult = creep.transfer(targetLab, resource.type, amountToWithdraw);  
                if (transferResult === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(targetLab, { visualizePathStyle: { stroke: '#ffffff' } });  
                }  
                // 更新剩余需要转移的资源量  
                if (transferResult === OK) { 
                    if(resource.amount === 0){
                        Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'boostGetResource');
                    } 
                }  
            }  
        }  
    } 
    
    if(false){
        const labs = creep.room.lab;
        // labs[0].boostCreep(creep, RANGED_ATTACK);
        // labs[1].boostCreep(creep, HEAL);
        const result1 = labs[0].boostCreep(creep, RANGED_ATTACK);
        const result2 = labs[1].boostCreep(creep, HEAL);
        const result3 = labs[2].boostCreep(creep, WORK);
        if (result1 === OK) { 
        } else if (result1 === ERR_NOT_IN_RANGE) {  
            creep.moveTo(labs[0], { visualizePathStyle: { stroke: '#0000ff' } });  
        }            
        if (result2 === OK) { 
        } else if (result2 === ERR_NOT_IN_RANGE) {  
            creep.moveTo(labs[1], { visualizePathStyle: { stroke: '#0000ff' } });  
        }
        if (result3 === OK) { 
            creep.memory.boosted = true;
        } else if (result3 === ERR_NOT_IN_RANGE) {  
            creep.moveTo(labs[2], { visualizePathStyle: { stroke: '#0000ff' } });  
        }
    }

    const waypoints = [  
        { room: 'E56N13', x: 37, y: 48 },  
        { room: 'E56N12', x: 32, y: 48 },  
        { room: 'E56N11', x: 28, y: 45 },  
        { room: 'E56N10', x: 1, y: 15 },  
        { room: 'E55N10', x: 1, y: 19 },
        { room: 'E54N10', x: 1, y: 24 },  
        { room: 'E53N10', x: 27, y: 48 },  
        { room: 'E53N9', x: 45, y: 14 },  
        { room: 'E54N9', x: 48, y: 20 },  
        // { room: 'E55N9', x: 27, y: 6 },  
    ];  
    if (creep.memory.currentIndex != waypoints.length ) {  
        // 当前的目标索引  
        let currentIndex = creep.memory.currentIndex || 0;  
        // 当前目标  
        const currentWaypoint = waypoints[currentIndex];  
        // 如果creep不在目标房间或目标坐标上，则移向该目标  
        if (creep.room.name !== currentWaypoint.room ||  
            (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined &&  
            !creep.pos.isEqualTo(currentWaypoint.x, currentWaypoint.y))) {  
            if (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined) {  
                creep.moveTo(new RoomPosition(currentWaypoint.x, currentWaypoint.y, currentWaypoint.room), {  
                    visualizePathStyle: { stroke: '#ffaa00' }  
                });  
            } else {  
                creep.moveTo(new RoomPosition(25, 25, currentWaypoint.room), {  
                    visualizePathStyle: { stroke: '#ffaa00' }  
                });  
            }  
            return; // 移动操作后退出函数  
        }  
        creep.memory.currentIndex = currentIndex + 1;  
    }  
    var roleRepairer = {  
        /**
         * @param {Creep} creep 
         * **/
        run: function(creep) {
            //const tasksList = Memory.rooms[creep.memory.sourceRoomName].tasks;
            creep.memory.dontPullMe = true; 
            if (creep.memory.prepare === undefined) {  
                creep.memory.prepare = false;  
            }  
            if ( creep.memory.prepare === false) {
                this.prepare(creep)
                return; // 准备阶段
            } else {
                this.work(creep); // 工作
            }
    
    
        },    
        // 准备阶段
        prepare: function(creep) {
            if (creep.memory.boosted === undefined) {  
                creep.memory.boosted = false;  
            }  
            if (creep.room.boosted === false) {
                const labs = creep.room.lab;
                const result_1 = labs[0].boostCreep(creep, ATTACK);
                // const result2 = labs[1].boostCreep(creep, HEAL);
                // const result3 = labs[2].boostCreep(creep, WORK);
                if (result_1 === OK) { 
                    creep.memory.boosted = true;
                } else if (result_1 === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(labs[0], { visualizePathStyle: { stroke: '#0000ff' } });  
                }            
                return;
            } else {
                creep.memory.prepare = true;
            }
            return true;
        },
    
        // 工作阶段
        work: function(creep) {
            // 寻找最近的敌人
            const enemys = creep.room.find(FIND_HOSTILE_CREEPS);
                // 按距离排序，但不使用findClosestByPath
            enemys.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep));
            
            // 如果找到敌人
            if (true) {
                // 寻找距离敌人最近的rampart
                const flag = Game.flags['Flag1'];
                // for(let rampart of ramparts){
                //     if(rampart.hits < 4000000){
                //         creep.memory.targetRampart = rampart.id;
                //     }
                // }
                // let targetRampart = findClosestTarget(enemys[0], ramparts)
                // console.log(targetRampart)
                // const targetRampart = creep.room[creep.memory.targetRampart];
                // 如果找到了rampart
                if ( flag ) {
                    // 如果creep不在rampart上，则移动到rampart
                    if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y) {
                        creep.attack(enemys[0]);
                    } else {
                        // 如果creep已经在rampart上，则攻击敌人
                        creep.moveTo(flag, { visualizePathStyle: { stroke: '#ff0000' } });
                    }
                } 
            } 
            return true;
        },
    }
    
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

    var roleScavenger = {
        /**  
         * @param {Creep} creep 
         */  
        //-------------------------------------------------------------------------------------
        renew: function(creep, spawns) {
            // 检查creep的生命周期是否低于设定的阈值
            if (creep.ticksToLive < 1300) {
                const spawn = spawns[0]; // 选择第一个spawn
                if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                    // 如果creep不在spawn范围内，则移动到spawn
                    creep.moveTo(spawn, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            } else if (creep.memory.renewing && creep.ticksToLive > 1300) {
                // 如果creep的生命周期大于1300且处于renewing状态，则退出renewing状态
                creep.memory.renewing = false;
            }
        },
        //---------------------------------------------------------------------------------------
        // 主运行函数
        run: function(creep) {
            if (creep.memory.prepare === undefined) {  
                creep.memory.prepare = false;  
            }  
            if ( creep.memory.prepare === false) {
                this.prepare(creep)
                return; // 准备阶段
            }
            this.toggleState(creep);  
            // if (creep.memory.renewing) {
            //     const spawns = creep.room.spawn;
            //     this.renew(creep, spawns);
            //     // 如果renew之后生命周期仍然低于1300，则不执行任务
            //     if (creep.ticksToLive < 1300) {
            //         return; // 结束函数执行，不执行任何任务
            //     }
            // }
            if (!creep.memory.upgradeing ) {
                creep.memory.dontPullMe = false; 
                this.source(creep); // 采集能量
            } else {
                creep.memory.dontPullMe = true; 
                this.work(creep); // 工作
            }
        },
    
        toggleState: function(creep) {  
            if (creep.memory.upgradeing === undefined) {  
                creep.memory.upgradeing = false;  
            }  
            // if (creep.ticksToLive < 500 && !creep.memory.renewing) {
            //     creep.memory.renewing = true;
            // }
            if (creep.memory.upgradeing && creep.store[RESOURCE_ENERGY] === 0) {  
                creep.memory.upgradeing = false;  
            }  
            // 如果不在转移且容量已满，则开始转移  
            if (!creep.memory.upgradeing && creep.store.getFreeCapacity() === 0) {  
                creep.memory.upgradeing = true;  
            }  
        },  
    
        
        // 准备阶段
        prepare: function(creep) {
            creep.memory.dontPullMe = false;  
            const sourceRoomName = creep.memory.sourceRoomName;
            const waypoints = [  
                // { room: 'E56N13', x: 37, y: 48 },  
                // { room: 'E56N12', x: 32, y: 48 },  
                // { room: 'E56N11', x: 28, y: 45 },  
                // { room: 'E56N10', x: 1, y: 15 },  
                // { room: 'E55N10', x: 1, y: 19 },
                // { room: 'E54N10', x: 1, y: 24 },  
                // { room: 'E53N10', x: 27, y: 48 },  
                // { room: 'E53N9', x: 45, y: 14 },  
                // { room: 'E54N9', x: 48, y: 20 },  
                { room: 'E56N17', x: 36, y: 18 },  
            ];  
            if (creep.memory.currentIndex != waypoints.length) {  
                // 当前的目标索引  
                let currentIndex = creep.memory.currentIndex || 0;  
                // 当前目标  
                const currentWaypoint = waypoints[currentIndex];  
                // 如果creep不在目标房间或目标坐标上，则移向该目标  
                if (creep.room.name !== currentWaypoint.room ||  
                    (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined &&  
                    !creep.pos.isEqualTo(currentWaypoint.x, currentWaypoint.y))) {  
                    if (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined) {  
                        creep.moveTo(new RoomPosition(currentWaypoint.x, currentWaypoint.y, currentWaypoint.room), {  
                            visualizePathStyle: { stroke: '#ffaa00' }  
                        });  
                    } else {  
                        creep.moveTo(new RoomPosition(25, 25, currentWaypoint.room), {  
                            visualizePathStyle: { stroke: '#ffaa00' }  
                        });  
                    }  
                    return; // 移动操作后退出函数  
                }  
                creep.memory.currentIndex = currentIndex + 1;  
            }  
    
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            } else {
                creep.memory.prepare = true;
            }
            return true;
        },
    
        // source阶段
        source: function(creep) {
            creep.memory.dontPullMe = true;  
            const sourceRoomName = creep.memory.sourceRoomName;
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            } else {
                // const storage = creep.room.storage;
                // if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                //     creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                // } 
                const terminal = creep.room.terminal;
                const storage = creep.room.storage;
                //const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;
                if(terminal){
                    if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                    } 
                    
                } else {
                    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                    } 
                }
            } 
            return true;
        },
    
        // 工作阶段
        work: function(creep) {
            creep.memory.dontPullMe = true;  
            const targetRoomName = creep.memory.targetRoomName;
            if (creep.room.name !== targetRoomName) {
                creep.moveTo(new RoomPosition(25, 25, targetRoomName), { visualizePathStyle: { stroke: '#00aaff' } });
                return;
            } else {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
                        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
                    } 
                }
            return true; 
        },
    };

    MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL
    
    
    var roleRepairer = {  
        /**
         * @param {Creep} creep 
         * **/
        run: function(creep) {
            //const tasksList = Memory.rooms[creep.memory.sourceRoomName].tasks;
            creep.memory.dontPullMe = true; 
            if (creep.memory.prepare === undefined) {  
                creep.memory.prepare = false;  
            }  
            if ( creep.memory.prepare === false) {
                this.prepare(creep)
                return; // 准备阶段
            } else {
                this.work(creep); // 工作
            }
    
    
        },    
        // 准备阶段
        prepare: function(creep) {
            if (creep.memory.boosted === undefined) {  
                creep.memory.boosted = false;  
            }  
            if (creep.room.boosted === false) {
                const labs = creep.room.lab;
                const result_1 = labs[0].boostCreep(creep, ATTACK);
                // const result2 = labs[1].boostCreep(creep, HEAL);
                // const result3 = labs[2].boostCreep(creep, WORK);
                if (result_1 === OK) { 
                    creep.memory.boosted = true;
                } else if (result_1 === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(labs[0], { visualizePathStyle: { stroke: '#0000ff' } });  
                }            
                return;
            } else {
                creep.memory.prepare = true;
            }
            return true;
        },
    
        // 工作阶段
        work: function(creep) {
            // 寻找最近的敌人
            const enemys = creep.room.find(FIND_HOSTILE_CREEPS);
                // 按距离排序，但不使用findClosestByPath
            enemys.sort((a, b) => a.pos.getRangeTo(creep) - b.pos.getRangeTo(creep));
            
            // 如果找到敌人
            if (true) {
                // 寻找距离敌人最近的rampart
                const flag = Game.flags['Flag1'];
                // for(let rampart of ramparts){
                //     if(rampart.hits < 4000000){
                //         creep.memory.targetRampart = rampart.id;
                //     }
                // }
                // let targetRampart = findClosestTarget(enemys[0], ramparts)
                // console.log(targetRampart)
                // const targetRampart = creep.room[creep.memory.targetRampart];
                // 如果找到了rampart
                if ( flag ) {
                    // 如果creep不在rampart上，则移动到rampart
                    if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y) {
                        creep.attack(enemys[0]);
                    } else {
                        // 如果creep已经在rampart上，则攻击敌人
                        creep.moveTo(flag, { visualizePathStyle: { stroke: '#ff0000' } });
                    }
                } 
            } 
            return true;
        },
    }
    const nuker = Game.getObjectById('66e40b7a94040f16ff7e2535');
    Game.rooms['E58N14'].nuker.launchNuke(new RoomPosition(49,0, 'E53N4'));
    var roleScavenger = {
        /**  
         * @param {Creep} creep 
         */  
        //-------------------------------------------------------------------------------------
        renew: function(creep, spawns) {
            // 检查creep的生命周期是否低于设定的阈值
            if (creep.ticksToLive < 1300) {
                const spawn = spawns[0]; // 选择第一个spawn
                if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                    // 如果creep不在spawn范围内，则移动到spawn
                    creep.moveTo(spawn, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            } else if (creep.memory.renewing && creep.ticksToLive > 1300) {
                // 如果creep的生命周期大于1300且处于renewing状态，则退出renewing状态
                creep.memory.renewing = false;
            }
        },
        //---------------------------------------------------------------------------------------
        // 主运行函数
        run: function(creep) {
            if (creep.memory.prepare === undefined) {  
                creep.memory.prepare = false;  
            }  
            if ( creep.memory.prepare === false) {
                this.prepare(creep)
                return; // 准备阶段
            }
            this.toggleState(creep);  
            // if (creep.memory.renewing) {
            //     const spawns = creep.room.spawn;
            //     this.renew(creep, spawns);
            //     // 如果renew之后生命周期仍然低于1300，则不执行任务
            //     if (creep.ticksToLive < 1300) {
            //         return; // 结束函数执行，不执行任何任务
            //     }
            // }
            if (!creep.memory.upgradeing ) {
                creep.memory.dontPullMe = false; 
                this.source(creep); // 采集能量
            } else {
                creep.memory.dontPullMe = true; 
                this.work(creep); // 工作
            }
        },
    
        toggleState: function(creep) {  
            if (creep.memory.upgradeing === undefined) {  
                creep.memory.upgradeing = false;  
            }  
            // if (creep.ticksToLive < 500 && !creep.memory.renewing) {
            //     creep.memory.renewing = true;
            // }
            if (creep.memory.upgradeing && creep.store[RESOURCE_ENERGY] === 0) {  
                creep.memory.upgradeing = false;  
            }  
            // 如果不在转移且容量已满，则开始转移  
            if (!creep.memory.upgradeing && creep.store.getFreeCapacity() === 0) {  
                creep.memory.upgradeing = true;  
            }  
        },  
    
        // 准备阶段
        prepare: function(creep) {
            creep.memory.dontPullMe = false;  
            const sourceRoomName = creep.memory.sourceRoomName;
            const waypoints = [  
                // { room: 'E56N13', x: 37, y: 48 },  
                // { room: 'E56N12', x: 32, y: 48 },  
                // { room: 'E56N11', x: 28, y: 45 },  
                // { room: 'E56N10', x: 1, y: 15 },  
                // { room: 'E55N10', x: 1, y: 19 },
                // { room: 'E54N10', x: 1, y: 24 },  
                // { room: 'E53N10', x: 27, y: 48 },  
                // { room: 'E53N9', x: 45, y: 14 },  
                // { room: 'E54N9', x: 48, y: 20 },  
                { room: 'E56N17', x: 36, y: 18 },  
            ];  
            if (creep.memory.currentIndex != waypoints.length) {  
                // 当前的目标索引  
                let currentIndex = creep.memory.currentIndex || 0;  
                // 当前目标  
                const currentWaypoint = waypoints[currentIndex];  
                // 如果creep不在目标房间或目标坐标上，则移向该目标  
                if (creep.room.name !== currentWaypoint.room ||  
                    (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined &&  
                    !creep.pos.isEqualTo(currentWaypoint.x, currentWaypoint.y))) {  
                    if (currentWaypoint.x !== undefined && currentWaypoint.y !== undefined) {  
                        creep.moveTo(new RoomPosition(currentWaypoint.x, currentWaypoint.y, currentWaypoint.room), {  
                            visualizePathStyle: { stroke: '#ffaa00' }  
                        });  
                    } else {  
                        creep.moveTo(new RoomPosition(25, 25, currentWaypoint.room), {  
                            visualizePathStyle: { stroke: '#ffaa00' }  
                        });  
                    }  
                    return; // 移动操作后退出函数  
                }  
                creep.memory.currentIndex = currentIndex + 1;  
            }  
    
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            } else {
                creep.memory.prepare = true;
            }
            return true;
        },
    
        // source阶段
        source: function(creep) {
            creep.memory.dontPullMe = true;  
            const sourceRoomName = creep.memory.sourceRoomName;
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            } else {
                // const storage = creep.room.storage;
                // if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                //     creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                // } 
                const terminal = creep.room.terminal;
                const storage = creep.room.storage;
                //const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;
                if(terminal){
                    if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                    } 
                    
                } else {
                    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                    } 
                }
            } 
            return true;
        },
    
        // 工作阶段
        work: function(creep) {
            creep.memory.dontPullMe = true;  
            const targetRoomName = creep.memory.targetRoomName;
            if (creep.room.name !== targetRoomName) {
                creep.moveTo(new RoomPosition(25, 25, targetRoomName), { visualizePathStyle: { stroke: '#00aaff' } });
                return;
            } else {
                    if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
                        creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
                    } 
                }
            return true; 
        },
    };
    export default roleScavenger;
    var roleCentraltransferer = {  
        /**    
         * @param {Creep} creep - The creep to run logic for.    
         */    
        run: function(creep) {    
            const roomMemory = Memory.rooms[creep.room.name];   
            // 根据房间名设置不同的目标位置  
            let targetPosition;  
            if (creep.room.name === 'E54N19') {  
                targetPosition = new RoomPosition(5, 9, creep.room.name);  
            } else if (creep.room.name === 'E56N13') {  
                targetPosition = new RoomPosition(43, 16, creep.room.name);  
            } else if (creep.room.name === 'E53N19') {  
                targetPosition = new RoomPosition(11, 38, creep.room.name);  
            } else if (creep.room.name === 'E55N21') {  
                targetPosition = new RoomPosition(6, 20, creep.room.name);  
            } else if (creep.room.name === 'E56N17') {  
                targetPosition = new RoomPosition(35, 21, creep.room.name);  
            } else if (creep.room.name === 'E55N9') {  
                targetPosition = new RoomPosition(31, 4, creep.room.name);  
            } 
            creep.memory.dontPullMe = true;    
            // 如果creep尚未到达目标位置（通过比较坐标和房间名）    
            if (creep.pos.x !== targetPosition.x || creep.pos.y !== targetPosition.y || creep.room.name !== targetPosition.roomName) {    
                // 移动到目标位置    
                creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ffaa00', opacity: 0.5, lineStyle: 'dashed' } });    
            } else {    
                // 到达目标位置后执行能量管理任务    
                this.manageEnergy(creep, roomMemory);    
            }    
        },  
        /**  
         * 管理Terminal和Storage之间的能量平衡  
         * @param {Creep} creep  
         * @param {Object} roomMemory  房间内存对象，包含关于房间状态的信息    
         */  
        manageEnergy: function(creep, roomMemory) {  
            // 查找Terminal和Storage  
            const terminal = creep.room.terminal;
            const storage = creep.room.storage;
            const centerLink = creep.room[roomMemory.centerLinkId]; 
            if(roomMemory.transferEnergyToStorage){ //如果中央link发布转移能量到storage当中，就将中央link的能量提取出来到storage当中
    
                if (centerLink.store.energy >= 700 && creep.store[RESOURCE_ENERGY] === 0) {  
                    if(creep.withdraw(centerLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(centerLink, {visualizePathStyle: {stroke: '#ffaa00'}});  
                    }
                }  else if (creep.store[RESOURCE_ENERGY] > 0){
                    if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#00ffaa'}});  
                    }
                }
                // // //E54N19转移氢元素
                // const target = RESOURCE_OXYGEN;
                // if (storage && creep.room.name === 'E55N9' ) { 
                //    // 检查creep是否已经达到了其能携带HYDROGEN的容量上限  
                //     const terminalStore = terminal.store[target] || 0; 
                //     if(creep.store[RESOURCE_ENERGY] === 0){
                //         if ( true ) { 
                //             if (creep.store.getFreeCapacity(target) > 0) {  
                //                // 尝试从storage中取出HYDROGEN  
                //                 if (creep.withdraw(terminal, target) === ERR_NOT_IN_RANGE) {  
                //                    // 如果不在范围内，则移动到storage  
                //                     creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
                //                 }  
                //             } else {  
                //                     if (creep.transfer(storage, target) === ERR_NOT_IN_RANGE) {  
                //                        // 如果不在范围内，则移动到终端  
                //                         creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
                //                     }  
                //                 }  
                //             }
                //     } 
                // }
                if (storage && terminal && (  creep.room.name === 'E55N9' || creep.room.name === 'E56N17' || creep.room.name === 'E56N13'|| creep.room.name === 'E55N21')) {
                    // 检查terminal中是否有能量||
                    const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;
                    const storageEnergy = storage.store[RESOURCE_ENERGY] || 0;
                    if (terminalEnergy > 0) { // 假设storage还有至少250000空间
                        // 检查creep是否已经达到了其能携带能量的容量上限
                        if (creep.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                            // 尝试从terminal中取出能量
                            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                // 如果不在范围内，则移动到terminal
                                creep.moveTo(terminal, { visualizePathStyle: { stroke: '#00ffaa' } });
                            }
                        } else {
                            // 如果creep已经携带了能量
                            // 尝试将能量转移到storage
                            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                // 如果不在范围内，则移动到storage
                                creep.moveTo(storage, { visualizePathStyle: { stroke: '#00ffaa' } });
                            }
                        }
                    }
                    // 如果storage的能量已经足够或terminal中没有能量，可以选择让creep执行其他任务或等待
                }
            } else if(roomMemory.requestEnergyFromCenterLink){ 
                //如果upgradelink发布向中央link收集能量，检测中央link的能量是否超过799，如果超过则待机，如果没有就将storage的能量转移到中央link；
                if (centerLink) {  
                    // 检查central link的能量  
                    if (centerLink.store.energy >= 800) {  
                    //待机
                    } else {  
                        if (creep.store[RESOURCE_ENERGY] === 0) {  
                            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
                            }  
                        }  else  {  
                            if (creep.transfer(centerLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                                creep.moveTo(centerLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
                            }  
                        }  
                    }  
                } 
            }
        }  
    };  
    var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTransferer = require('role.transferer');
var roleRepairer = require('role.repairer');
var E54N19 = require('E54N19');
var E56N13 = require('E56N13');
var roleAttacker = require('role.attacker');
var roleclaimer = require('role.claimer')
var rolethinker = require('role.thinker')
var roleNewHarvester = require('role.NewHarvester');
var roleNewtransferer = require('role.Newtransferer');
var roleScavenger = require('role.scavenger');
var roleAdventurer = require('role.adventurer');
var rolereserveController = require('role.reserveController');
var roleCentraltransferer = require('role.Centraltransferer');
var Tower = require('tower');
var Link = require('Link');
var Lab = require('Lab');
var PowerSpawn = require('powerSpawn');
var E53N19 = require('E53N19');
var E55N21 = require('E55N21');
var E56N17 = require('E56N17');
var E55N9 = require('E55N9');
var roleManager = require('role.manager');
var roleNewbuilder = require('role.Newbuilder');
var PowerCreep = require('powerCreep');
const market = require('market');  
const team = require('team');  
require('超级移动优化hotfix 0.9.4');
require('极致建筑缓存 v1.4.3');
require('闲聊 v1.0');
const profiler = require('screeps-profiler');

profiler.enable();
module.exports.loop = function() {
    profiler.wrap(function() {
      // Main.js logic should go here.
      for(var name in Memory.creeps) { // 释放内存
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            // console.log('已清理凉掉的ceeep的:', name);
            continue;
        }
    }
    TalkAll()
    if (Game.time % 10 == 0) {
        market.createBuyOrderForEnergy('E55N9');
        market.createBuyOrderForEnergy('E55N21');
        market.createBuyOrderForEnergy('E56N13');
        market.createBuyOrderForEnergy('E56N17');
        market.createBuyOrderForEnergy('E53N19');
    }
    if (Game.cpu.bucket === 10000) {//如果CPU到了一万点，则换成pixel
        Game.cpu.generatePixel();
        console.log(`兑换成功`);
    }
    var spawn1 = Game.spawns['Spawn1'];
    var spawn2 = Game.spawns['Spawn2'];
    var spawn3 = Game.spawns['Spawn3'];
    E54N19.run(spawn1, spawn2, spawn3);
    var spawn4 = Game.spawns['E56N13'];
    var spawn5 = Game.spawns['E56N13.2'];
    var spawn6 = Game.spawns['E56N13_3'];
    E56N13.run(spawn4, spawn5, spawn6);
    var spawn7 = Game.spawns['E53N19'];
    var spawn8 = Game.spawns['E53N19.2'];
    E53N19.run(spawn7, spawn8);
    var spawn9 = Game.spawns['E55N21'];
    var spawn10 = Game.spawns['E55N21.2'];
    E55N21.run(spawn9, spawn10);
    var spawn11 = Game.spawns['E56N17'];
    E56N17.run(spawn11);
    var spawn12 = Game.spawns['E55N9'];
    var spawn13 = Game.spawns['E55N9_1'];
    var spawn14 = Game.spawns['E55N9_2'];
    E55N9.run(spawn12, spawn13, spawn14);

    const powerSpawnIds = ['66ba2568af515e4e2eeb0736','671b23387dd1461439874c34','671b2a4d4823ba477c496404','670f7643e753d22f78042225']; 
    powerSpawnIds.forEach(powerSpawnId => {  
        const powerSpawn = Game.structures[powerSpawnId];  
        if (powerSpawn) {
            PowerSpawn.run(powerSpawn);  
        } 
    });

    const powerCreepIds = ['花枝','鱼枝']; 
    powerCreepIds.forEach(powerCreepId => {  
        const powerCreep = Game.powerCreeps[powerCreepId];  
        if (powerCreep) {
            PowerCreep.run(powerCreep);  
        } 
    });

    const rooms = ['E54N19','E53N19','E55N21','E56N13','E56N17','E55N9'];
    rooms.forEach(roomName => {
        Link.run(roomName);
        Tower.run(roomName);
    });

    const room_s = ['E55N8','E58N14'];
    room_s.forEach(roomName => {
        Tower.run(roomName);
    });

    const labIds = ['66964b23320b71a57c4ae06c','66b1a12076f6cf28f09961e2','6703796b8330fb2b1d643365','66b9e30275e9fc2eba8481b5']; 
    labIds.forEach(labId => {  
        const lab = Game.structures[labId];  
        if (lab) {
            Lab.run(lab);  
        } 
    });

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        else if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        else if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        else if(creep.memory.role == 'transferer') {
            roleTransferer.run(creep);
        }
        else if(creep.memory.role == 'repairer') {
            roleRepairer.run(creep);
        }
        else if(creep.memory.role == 'NewHarvester') {
            roleNewHarvester.run(creep);
        }
        else if(creep.memory.role == 'attacker') {
            roleAttacker.run(creep);
        }
        else if(creep.memory.role == 'manager') {
            roleManager.run(creep);
        }
        else if(creep.memory.role == 'thinker') {
            rolethinker.run(creep);
        }
        else if(creep.memory.role == 'Newtransferer') {
            roleNewtransferer.run(creep);
        }
        else if(creep.memory.role == 'Newbuilder') {
            roleNewbuilder.run(creep);
        }
        else if(creep.memory.role == 'scavenger') {
            roleScavenger.run(creep);
        }
        else if(creep.memory.role == 'claimer') {
            roleclaimer.run(creep);
        }
        else if(creep.memory.role == 'reserveController') {
            rolereserveController.run(creep);
        }
        else if(creep.memory.role == 'Centraltransferer') {
            roleCentraltransferer.run(creep);
        }
        else if(creep.memory.role == 'adventurer') {
            roleAdventurer.run(creep);
        }
        else if(creep.memory.role == 'Demolisher') {
            team.run(creep);
        }
        else if(creep.memory.role == 'Healer') {
            team.run(creep);
        }
    }



    // for(const id in Game.market.orders) {
    //     Game.market.cancelOrder(id);
    // }

    // const tasksList = Memory.rooms.E55N19.tasks;  
    // Memory.rooms.E54N19.tasks = tasksList.filter(task => task.type !== 'boostGetResource');
    //Memory.rooms.E56N17.centerLinkId = '670a0198bceb036510cd5109';
    // Memory.rooms.E55N9.upgradeLinkId = '671ba8732ee1cc70a5271c40';
    
    });
  }

  var roleScavenger = {
    /**  
     * @param {Creep} creep 
     */  
    //---------------------------------------------------------------------------------------
    // 主运行函数
    run: function(creep) {
        creep.memory.dontPullMe = true; 
        if (creep.memory.prepare === undefined) {  
            creep.memory.prepare = false;  
        }  
        if ( creep.memory.prepare === false) {
            this.prepare(creep)
            return; // 准备阶段
        } else {
            this.work(creep); // 工作
        }
    },
    
    // 准备阶段
    prepare: function(creep) {
        creep.memory.dontPullMe = false;  
        const sourceRoomName = creep.memory.sourceRoomName;
        if (creep.room.name !== sourceRoomName) {
            creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
            return;
        } else {
            const terminal = creep.room.terminal;
            const roomName = terminal.pos.roomName;  
            const position = this.getPositionInMatrix(creep.memory.workLoc);
            const targetX = terminal.pos.x + position.x;
            const targetY = terminal.pos.y + position.y;
            const targetPosition = new RoomPosition(targetX, targetY, roomName);  
            if(creep.pos.x === targetX && creep.pos.y === targetY){
                creep.memory.prepare = true;
            } else {
                creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
            }
        }
        return true;
    },
    // 工作阶段
    work: function(creep) {
        creep.memory.dontPullMe = true;  
        const terminal = creep.room.terminal;
        // const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;
        // const storageEnergy = storage.store[RESOURCE_ENERGY] || 0;
        creep.withdraw(terminal, RESOURCE_ENERGY);
        creep.upgradeController(creep.room.controller);
        return true; 
    },
    // 获取creep在方阵中的位置
    getPositionInMatrix: function(workLoc) {
        // 假设方阵的每个单位距离为1
        const positions = [
            { x: 0, y: 1 }, // workLoc 0
            { x: -1, y: 1 },  // workLoc 1
            { x: -1, y: 0 },  // workLoc 2
            { x: -1, y: -1 },   // workLoc 3
            { x: 0, y: -1 },   // workLoc 4
            { x: 1, y: 1 },   // workLoc 5
            { x: 1, y: 0 },   // workLoc 6
            { x: 1, y: -1 }   // workLoc 7
        ];
        return positions[workLoc];
    },
};
        // console.log(spawns)
        const Newspawns = spawns.find(s => s.spawning && (!s.effects || !s.effects.some(e => e.effect == PWR_OPERATE_SPAWN && e.ticksRemaining > 0)))
        if(Newspawns){
            if(powerCreep.usePower(PWR_OPERATE_SPAWN, Newspawns) == ERR_NOT_ENOUGH_RESOURCES){
                if (powerCreep.withdraw(storage, RESOURCE_OPS, 100) === ERR_NOT_IN_RANGE) {
                    powerCreep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            } else if(powerCreep.usePower(PWR_OPERATE_SPAWN, Newspawns) == ERR_NOT_IN_RANGE){
                powerCreep.moveTo(Newspawns, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        if(creep.room.name === 'E58N14'){
            if (creep.memory.li === undefined) {  
                creep.memory.li = 90000000;  
            }  
            creep.memory.li = 100000000
        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位 
        const room = creep.room;
        const recentlyAttackedRamparts = findRecentlyAttackedRamparts(room);
        const closestSites = findClosestTarget(creep, constructionSites);
        const rampartList = [ 
            '672a32495d5e481df27c2fbf','672a324be41facebb0feb25f','672a327f07eedc42af1dbc88','67299e6810381bfca18a4c53','67299e6d1b89b3895cb349ea','67299e726176672e4e0498d4','67299e7889039e7706c0d03d'
            ,'67299e30c46db7488b75e80d','67299e33585f0d1caec317bd'
        ];  
        findAndSetNextTargetRampart(creep, rampartList);  
        const targetRampart = creep.room[creep.memory.targetRampartId]
        if (recentlyAttackedRamparts.length > 0) {
            this.buildRampart(creep, recentlyAttackedRamparts[0]);
        } else {
            if(constructionSites.length > 0){
                this.buildConstruction_Sites(creep, closestSites);  
            } else {
                this.buildRampart(creep, targetRampart);
            }
        }
        } else if(creep.room.name === 'E56N13'){
            if (creep.memory.li === undefined) {  
                creep.memory.li = 60000000;  
            }  
            creep.memory.li = 70000000
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位 
            const room = creep.room;
            const recentlyAttackedRamparts = findRecentlyAttackedRamparts(room);
            const closestSites = findClosestTarget(creep, constructionSites);
            // const rampartList = [
            //     '66a9fc8a5a0ce7787189cc38','66a9a299cb336bdc5d15b21c','66aa38c3de4c6fb8b65f8ba4','66aafc3e8f6e142309905e61','66c2b0e90aebc4c416865fb5',
            //     '66c3531926fde5b7c93dd0c5','66c950b31ca5717f9da960de','66cabaf0cae6997323ffe566','66cc110aef5d9344b3f9d90a','66cd3ac6be7f7570f590396e',
            //     '66a864c5d1f7b02783740cfa','66a6fe5e39f17c334dc39541','66f16f554419cc4e51c10510','66f16f4fd2fa66da62ce4613','66f16f39c09fa42f62a47fa2',
            //     '66f16f36afac5a6a666ccd82','66f16f304ebacb5b62e71a18','66d2b37b959ab7e33a540e2a','66d1a24b3ba689cfc829383b'
            // ];  
            // findAndSetNextTargetRampart(creep, rampartList);  
            const targetRampart = creep.room[creep.memory.targetRampartId]
            if (recentlyAttackedRamparts.length > 0) {
                this.buildRampart(creep, recentlyAttackedRamparts[0]);
            } else {
                if(constructionSites.length > 0){
                    this.buildConstruction_Sites(creep, closestSites);  
                } else {
                    this.buildRampart(creep, targetRampart);
                }
            }
        } 
        else if(creep.room.name === 'E53N19'){
            if (creep.memory.li === undefined) {  
                creep.memory.li = 20000000;  
            }  
            creep.memory.li = 40000000; 
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位 
            const room = creep.room;
            const recentlyAttackedRamparts = findRecentlyAttackedRamparts(room);
            const closestSites = findClosestTarget(creep, constructionSites);
            const rampartList = [ 
                '67035bc2cfef361116da291a','67035bc4ba646c711f445193','67035bc74c05c14847d6d4c4','67035bca542c24b8a3dd0edc','67035bd01b08d8114b2fb42b',
                '67035b9acbf0b63e9e105bf0','67035ba0e040928ae8ae18b4','67035ba6500ea2223c383ba1','67035bab7bd619040100386d','67035bb917094ad691431e07',
                '67035bb6ec9f72ea8d4c3e3c','67035bb4e753d285b900a828','67035bb127446894dfac826c','6701319850a1c32d00cf5bf7','6701319e8330fb01b9638e6e',
                '67035bf46ded4a22c1220e9b'
            ];  
            findAndSetNextTargetRampart(creep, rampartList);  
            const targetRampart = creep.room[creep.memory.targetRampartId]
            if (recentlyAttackedRamparts.length > 0) {
                this.buildRampart(creep, recentlyAttackedRamparts[0]);
            } else {
                if(constructionSites.length > 0){
                    this.buildConstruction_Sites(creep, closestSites);  
                } else {
                    this.buildRampart(creep, targetRampart);
                }
            }
        }

        var team = {
            /**  
             * @param {Creep} creep 
             */ 
            run: function(creep) {
                // 检查Creep的职责  
                /** 
                 * Demolisher的职责是: 带有Work/Attack部件的creep,用于拆除Rampart或攻击Creep
                 * Healer的职责是: 带有Heal部件的creep,专门用于治疗Demolisher
                 */
                if (creep.memory.role === 'Demolisher') {  
                    // 作为Demolisher的行为  
                    this.runAsDemolisher(creep);  
                } else if (creep.memory.role === 'Healer') {  
                    // 作为Healer的行为  
                    this.runAsHealer(creep);  
                } 
                // else {  
                //     // 默认作为Guardian的行为  
                //     this.runAsGuardian(creep);  
                // } 
            },
            // 准备阶段
            /**
             * 
             * @param {Creep} creep 
             * @returns 
             */
            prepare: function(creep) {
                /**
                 * 在准备阶段要完成三件事情,第一进行组队,第二进行Boost流程,第三,到达指定目的地
                 */
                if (creep.memory.unit === undefined) {  
                    creep.memory.unit = false;  
                }  
                /**
                 * 四人小队配置表如下：两个Demolisher，两个Healer
                 * Healer通过findBro模块查找一个未组队的Demolisher，交换Id到自身的memory,标记为bro_1
                 * Demolisher通过findBro模块查找一个已组队的Demolisher，交换Id到自身的memory,标记为bro_2
                 * 两个Demolisher交换bro_1的Id到自己的memory的bro_3，自此，组队结束。
                 */
                if (creep.memory.role === 'Demolisher'){
                    if(creep.memory.unit === true){
                        if(creep.memory.workLoc === 0) {
                            creep.memory.bro_0 = creep.id;
                            // console.log(this.findBro(creep))
                            creep.memory.bro_1 = this.findBro(creep);
                        } else {
                            creep.memory.bro_1 = creep.id;
                            creep.memory.bro_0 = this.findBro(creep);
                        }
                    }
                    if(creep.memory.bro_2 || creep.memory.bro_3){
                        creep.memory.unit = true;
                    }
                    if((creep.memory.bro_1 || creep.memory.bro_0) && creep.memory.unit === true){
                        if(creep.memory.workLoc === 0) {
                            //交换信息 
                            //0要交换2 1要交换3
                            var broCreep = creep.room[creep.memory.bro_1];
                            if(broCreep){
                                broCreep.memory.bro_0 = creep.id;
                                creep.memory.bro_3 = broCreep.memory.bro_3;
                            }
                        } else if(creep.memory.workLoc === 1){
                            //交换信息 
                            var broCreep = creep.room[creep.memory.bro_0];
                            if(broCreep){
                                broCreep.memory.bro_1 = creep.id;
                                creep.memory.bro_2 = broCreep.memory.bro_2;
                            }
                        }
                        if(creep.memory.bro_0 && creep.memory.bro_1 && creep.memory.bro_2 && creep.memory.bro_3){
                            if (creep.memory.boosted === undefined) {  
                                creep.memory.boosted = false;  
                            }  
                        } else {
                            const spawns = creep.room.spawn;
                            const targetSpawn = spawns[2]; 
                            if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                                // 如果creep不在spawn范围内，则移动到spawn
                                creep.moveTo(targetSpawn, {visualizePathStyle: {stroke: '#00ff00'}});
                            }
                        }
                    } else {
                        const spawns = creep.room.spawn;
                        const targetSpawn = spawns[2]; 
                        if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                            // 如果creep不在spawn范围内，则移动到spawn
                            creep.moveTo(targetSpawn, {visualizePathStyle: {stroke: '#00ff00'}});
                        }
                    }
                } else if (creep.memory.role === 'Healer'){
                    if(creep.memory.unit === false){
                        if(creep.memory.workLoc === 2) {
                            creep.memory.bro_2 = creep.id;
                            creep.memory.bro_0 = this.findBro(creep);
                        } else {
                            creep.memory.bro_3 = creep.id;
                            creep.memory.bro_1 = this.findBro(creep);
                        }
                    }
                    if(creep.memory.bro_1 || creep.memory.bro_0){
                        creep.memory.unit = true;
                    }
                    if((creep.memory.bro_1 || creep.memory.bro_0) && creep.memory.unit === true){
                        if(creep.memory.workLoc === 2) {
                            //交换信息 
                            var broCreep = creep.room[creep.memory.bro_0];
                            
                            broCreep.memory.bro_2 = creep.id;
                            creep.memory.bro_2 = creep.id;
                            creep.memory.bro_1 = broCreep.memory.bro_1;
                            creep.memory.bro_3 = broCreep.memory.bro_3;
                        } else if(creep.memory.workLoc === 3){
                            //交换信息 
                            var broCreep = creep.room[creep.memory.bro_1];
                            
                            broCreep.memory.bro_3 = creep.id;
                            creep.memory.bro_3 = creep.id;
                            creep.memory.bro_0 = broCreep.memory.bro_0;
                            creep.memory.bro_2 = broCreep.memory.bro_2;
                        }
                        if(creep.memory.bro_0 && creep.memory.bro_1 && creep.memory.bro_2 && creep.memory.bro_3){
                            if (creep.memory.boosted === undefined) {  
                                creep.memory.boosted = false;  
                            }  
                        } else {
                            const spawns = creep.room.spawn;
                            const targetSpawn = spawns[2]; 
                            if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                                // 如果creep不在spawn范围内，则移动到spawn
                                creep.moveTo(targetSpawn, {visualizePathStyle: {stroke: '#00ff00'}});
                            }
                        }
                    } else {
                        const spawns = creep.room.spawn;
                        const targetSpawn = spawns[2]; 
                        if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                            // 如果creep不在spawn范围内，则移动到spawn
                            creep.moveTo(targetSpawn, {visualizePathStyle: {stroke: '#00ff00'}});
                        }
                    } 
                }
                if(creep.memory.boosted === false){
                    const labs = creep.room.lab;  
                    // 检查 creep.memory 中是否有 boostIndex，如果没有则初始化为 0  
                    if (!creep.memory.boostIndex) {  
                        creep.memory.boostIndex = 0;  
                    }  
                    if(creep.memory.role === 'Demolisher'){
                        // 根据 boostIndex 获取对应的实验室和强化类型  
                        let boostLab, boostType;  
                        switch (creep.memory.boostIndex) {  
                            case 0:  
                            boostLab = labs[0];  
                            boostType = HEAL;  
                            break;  
                        case 1:  
                            boostLab = labs[1];  
                            boostType = RANGED_ATTACK;  
                            break;  
                        case 2:  
                            boostLab = labs[2];  
                            boostType = MOVE;  
                            break;  
                        case 3:  
                            boostLab = labs[3];  
                            boostType = TOUGH;  
                            break;  
                            default:  
                                // 如果 boostIndex 超出范围，重置为 0  
                                creep.memory.boostIndex = 0;  
                        }  
                        // 执行 boostCreep 操作  
                        const result = boostLab.boostCreep(creep, boostType);  
                        if (result === OK) {  
                            // 如果当前是最后一次强化，设置 boosted 为 true  
                            if (creep.memory.boostIndex === 3) {  
                                creep.memory.boosted = true;  
                            } else {  
                                // 否则，增加 boostIndex 以准备下一次强化  
                                creep.memory.boostIndex++;  
                            }  
                        } else if (result === ERR_NOT_IN_RANGE) {  
                            // 如果不在范围内，移动到对应的实验室  
                            creep.moveTo(boostLab, { visualizePathStyle: { stroke: '#0000ff' } });  
                        } else {  
                            // 处理其他可能的错误情况（可选）  
                            console.log(`Boost failed with error: ${result}`);  
                        }
                    }
                    if(creep.memory.role === 'Healer'){
                        // 根据 boostIndex 获取对应的实验室和强化类型  
                        let boostLab, boostType;  
                        switch (creep.memory.boostIndex) {  
                            case 0:  
                            boostLab = labs[0];  
                            boostType = HEAL;  
                            break;  
                        case 1:  
                            boostLab = labs[1];  
                            boostType = RANGED_ATTACK;  
                            break;  
                        case 2:  
                            boostLab = labs[2];  
                            boostType = MOVE;  
                            break;  
                        case 3:  
                            boostLab = labs[3];  
                            boostType = TOUGH;  
                            break;  
                            default:  
                                // 如果 boostIndex 超出范围，重置为 0  
                                creep.memory.boostIndex = 0;  
                        }  
                        // 执行 boostCreep 操作  
                        const result = boostLab.boostCreep(creep, boostType);  
                        if (result === OK) {  
                            // 如果当前是最后一次强化，设置 boosted 为 true  
                            if (creep.memory.boostIndex === 3) {  
                                creep.memory.boosted = true;  
                            } else {  
                                // 否则，增加 boostIndex 以准备下一次强化  
                                creep.memory.boostIndex++;  
                            }  
                        } else if (result === ERR_NOT_IN_RANGE) {  
                            // 如果不在范围内，移动到对应的实验室  
                            creep.moveTo(boostLab, { visualizePathStyle: { stroke: '#0000ff' } });  
                        } else {  
                            // 处理其他可能的错误情况（可选）  
                            console.log(`Boost failed with error: ${result}`);  
                        }
                    }
                }
                if (creep.memory.boosted === true) {
                    creep.memory.prepare = true;
                }
                return true;
            },
            //========================================================== 结盟模块===============================================================
            /**  
             *   
             * @param {Creep} creep   
             */  
            findBro: function(creep){  
                // 获取当前creep的workLoc值  
                const currentWorkLoc = creep.memory.workLoc;  
                // 定义目标workLoc值，基于当前workLoc决定  
                let targetWorkLoc;  
                if (currentWorkLoc === 2 && creep.memory.role === 'Healer') {  
                    targetWorkLoc = 0;  
                } else if (currentWorkLoc === 3 && creep.memory.role === 'Healer') {  
                    targetWorkLoc = 1;  
                } 
                if (currentWorkLoc === 0 && creep.memory.role === 'Demolisher') {  
                    targetWorkLoc = 1;  
                } else if (currentWorkLoc === 1 && creep.memory.role === 'Demolisher') {  
                    targetWorkLoc = 0;  
                } 
        
                // 根据creep的角色来寻找对应的兄弟creep  
                if(creep.memory.role === 'Healer'){  
                    const Bros = creep.room.find(FIND_MY_CREEPS);  
                    const demolishersWithTargetWorkLoc = Bros.filter(brotherCreep => {    
                        return (    
                            brotherCreep.memory.role === 'Demolisher' &&   
                            brotherCreep.memory.unit === false &&   
                            brotherCreep.id !== creep.id &&  
                            brotherCreep.memory.workLoc === targetWorkLoc  
                        );    
                    });   
                    if(demolishersWithTargetWorkLoc.length > 0 ){  
                        var bro = Game.getObjectById(demolishersWithTargetWorkLoc[0].id); // 0号Demolisher
                        var creep = Game.creeps[bro.name];
                        if(!creep.spawning){
                            return demolishersWithTargetWorkLoc[0].id;  
                        } else {
                            return null
                        }
                    } else {  
                        return null;  
                    }  
                }   
                else if(creep.memory.role === 'Demolisher'){  
                    const Bros = creep.room.find(FIND_MY_CREEPS);    
                    const teamWithTargetWorkLoc = Bros.filter(brotherCreep => {    
                        // 确保兄弟 creep 是 Demolisher，处于活动状态，并且不是当前 creep 自己，且workLoc匹配  
                        return (    
                            brotherCreep.memory.role === 'Demolisher' &&    
                            brotherCreep.memory.unit === true &&    
                            brotherCreep.id !== creep.id &&  
                            brotherCreep.memory.workLoc === targetWorkLoc  
                        );    
                    });    
                    
                    if (teamWithTargetWorkLoc.length > 0) {    
                        var bro = Game.getObjectById(teamWithTargetWorkLoc[0].id); // 0号Demolisher
                        var creep = Game.creeps[bro.name];
                        if(!creep.spawning){
                            return teamWithTargetWorkLoc[0].id;  
                        } else {
                            return null
                        }
                    } else {    
                        return null;   
                    }  
                }  
                // 如果角色不是Healer或Demolisher，返回null  
                return null;  
            },
            //========================================================== 结盟模块===============================================================
            /**    
             * Demolisher的行为    
             * @param {Creep} creep  
             */    
            runAsDemolisher: function(creep) {
                creep.memory.dontPullMe = false;
                if (creep.memory.unit === undefined) {
                    creep.memory.unit = false;
                }
                if (creep.memory.prepare === undefined) {
                    creep.memory.prepare = false;
                }
                if (creep.memory.prepare === false) {
                    this.prepare(creep);
                    return; // 准备阶段
                } else {
                    const flag_D = Game.flags['D'];
                    const flag_A = Game.flags['A'];
                    if ( flag_D ) {
                        const roomName = flag_D.pos.roomName;  
                        // console.log(roomName)
                        // 根据creep的workLoc属性确定其在方阵中的位置
                        const position = this.getPositionInMatrix(creep.memory.workLoc);
                        // 计算目标位置
                        const targetX = flag_D.pos.x + position.x;
                        const targetY = flag_D.pos.y + position.y;
                        const targetPosition = new RoomPosition(targetX, targetY, roomName);  
                        // 移动到目标位置
                        creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
                        //creep.moveTo(targetX, targetY, { visualizePathStyle: { stroke: '#ff0000' } });
                    } else if( flag_A ) {
                        var bro_0 = Game.getObjectById(creep.memory.bro_0); // 0号Demolisher
                        var bro_1 = Game.getObjectById(creep.memory.bro_1); // 1号Demolisher
                        var bro_2 = Game.getObjectById(creep.memory.bro_2); // 2号Healer
                        var bro_3 = Game.getObjectById(creep.memory.bro_3); // 3号Healer
                        const brothers = [  
                            bro_0, // 0号Demolisher  
                            bro_1, // 1号Demolisher  
                            bro_2, // 2号Healer  
                            bro_3  // 3号Healer  
                        ];  
                        let allFatigueZero = true; // 假设所有 creep 的疲劳值都为 0  
                        const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
                        const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                        // 遍历数组，检查每个 creep 的疲劳值，并计算路径（如果需要的话） 
                        if( bro_0 ){
                            for (let brother of brothers) {  
                                if(brother){
                                    console.log(brother, 'fatigue:', brother.fatigue);  
                                    // 检查疲劳值  
                                    if (brother.fatigue > 0) {  
                                        allFatigueZero = false; // 只要有一个 creep 的疲劳值不为 0，就设置标志为 false  
                                        break; // 可以选择在这里跳出循环，因为已经确定不是所有 creep 的疲劳值都为 0  
                                    }  
                                }
                            }  
                            const path = creep.room.findPath(bro_0.pos, flag_A.pos, {ignoreCreeps:true, ignoreRoads: true});
                            // 如果所有 creep 的疲劳值都为 0，则计算路径并移动它们  
                            if (allFatigueZero && path.length > 0) {  
                                creep.memory.dontPullMe = false;
                                for (let brother of brothers) {    
                                    if(brother){
                                        // const path = findPathConsideringWalls(bro_0, flag_A.pos);  
                                        if (path.length > 0) { // 检查路径长度  
                                            brother.move(path[0].direction); // 移动 creep  
                                        }  
                                    }
                                }  
                            }
                        } else if(bro_1){
                            for (let brother of brothers) {  
                                if(brother){
                                    console.log(brother, 'fatigue:', brother.fatigue);  
                                    // 检查疲劳值  
                                    if (brother.fatigue > 0) {  
                                        allFatigueZero = false; // 只要有一个 creep 的疲劳值不为 0，就设置标志为 false  
                                        break; // 可以选择在这里跳出循环，因为已经确定不是所有 creep 的疲劳值都为 0  
                                    }  
                                }
                            }  
                            const path = creep.room.findPath(bro_1.pos, flag_A.pos, {ignoreCreeps:true, ignoreRoads: true});
                            // 如果所有 creep 的疲劳值都为 0，则计算路径并移动它们  
                            if (allFatigueZero && path.length > 0) {  
                                creep.memory.dontPullMe = false;
                                for (let brother of brothers) {    
                                    if(brother){
                                        if (path.length > 0) { // 检查路径长度  
                                            brother.move(path[0].direction); // 移动 creep  
                                        }  
                                    }
                                }  
                            }
                        }
                    } 
                }
            },
            /**    
             * Healer的行为    
             * @param {Creep} creep  
             */    
            runAsHealer: function(creep) {
                creep.memory.dontPullMe = true;
                // const bro_1 = Game.getObjectById(creep.memory.bro_1); // 自身配套的Demolisher
                // const bro_2 = Game.getObjectById(creep.memory.bro_2); // 另一小队的Demolisher
                // const bro_3 = Game.getObjectById(creep.memory.bro_3); // 另一小队的Healer
                if (creep.memory.unit === undefined) {
                    creep.memory.unit = false;
                }
                if (creep.memory.prepare === undefined) {
                    creep.memory.prepare = false;
                }
                if (creep.memory.prepare === false) {
                    this.prepare(creep);
                    return; // 准备阶段
                } else {
                    const flag_D = Game.flags['D'];
                    const flag_A = Game.flags['A'];
                    if (flag_D) {
                        const roomName = flag_D.pos.roomName;  
                        // console.log(roomName)
                        // 根据creep的workLoc属性确定其在方阵中的位置
                        const position = this.getPositionInMatrix(creep.memory.workLoc);
                        // 计算目标位置
                        const targetX = flag_D.pos.x + position.x;
                        const targetY = flag_D.pos.y + position.y;
                        const targetPosition = new RoomPosition(targetX, targetY, roomName);  
                        // 移动到目标位置
                        creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
                        //creep.moveTo(targetX, targetY, { visualizePathStyle: { stroke: '#ff0000' } });
                    } else if( flag_A ) {
                        var bro_0 = Game.getObjectById(creep.memory.bro_0); // 0号Demolisher
                        var bro_1 = Game.getObjectById(creep.memory.bro_1); // 1号Demolisher
                        var bro_2 = Game.getObjectById(creep.memory.bro_2); // 2号Healer
                        var bro_3 = Game.getObjectById(creep.memory.bro_3); // 3号Healer
                        const brothers = [  
                            bro_0, // 0号Demolisher  
                            bro_1, // 1号Demolisher  
                            bro_2, // 2号Healer  
                            bro_3  // 3号Healer  
                        ]; 
                        for (let brother of brothers) {  
                            if(brother){
                                if( creep.hits < creep.hitsMax ){
                                    bro_0.heal(brother);
                                    bro_1.heal(brother);
                                    bro_2.heal(brother);
                                    bro_3.heal(brother);
                                }
                            }
                        }  
                    }
                }
            },
            
            // 获取creep在方阵中的位置
            getPositionInMatrix: function(workLoc) {
                // 假设方阵的每个单位距离为1
                const positions = [
                    { x: 0, y: 0 }, // workLoc 0
                    { x: 0, y: 1 },  // workLoc 1
                    { x: 1, y: 0 },  // workLoc 2
                    { x: 1, y: 1 }   // workLoc 3
                ];
                return positions[workLoc];
            },
        
            // 获取creep在方阵中的位置
            A: function(workLoc) {
                // 假设方阵的每个单位距离为1
                const positions = [
                    { x: 0, y: 0 }, // workLoc 0
                    { x: 0, y: 1 },  // workLoc 1
                    { x: 1, y: 0 },  // workLoc 2
                    { x: 1, y: 1 }   // workLoc 3
                ];
                return positions[workLoc];
            },
        
            // 获取creep在方阵中的位置
            S: function(workLoc) {
                // 假设方阵的每个单位距离为1
                const positions = [
                    { x: 0, y: 0 }, // workLoc 0
                    { x: 1, y: 0 },  // workLoc 1
                    { x: 0, y: -1 },  // workLoc 2
                    { x: 0, y: -1 }   // workLoc 3
                ];
                return positions[workLoc];
            },
            // 获取creep在方阵中的位置
            D: function(workLoc) {
                // 假设方阵的每个单位距离为1
                const positions = [
                    { x: 0, y: 0 }, // workLoc 0
                    { x: 0, y: 1 },  // workLoc 1
                    { x: -1, y: 0 },  // workLoc 2
                    { x: -1, y: 1 }   // workLoc 3
                ];
                return positions[workLoc];
            },
            // 获取creep在方阵中的位置
            W: function(workLoc) {
                // 假设方阵的每个单位距离为1
                const positions = [
                    { x: 0, y: 0 }, // workLoc 0
                    { x: 1, y: 0 },  // workLoc 1
                    { x: 0, y: 1 },  // workLoc 2
                    { x: 1, y: 1 }   // workLoc 3
                ];
                return positions[workLoc];
            },
        };
        const TerminalManager = {
            /**
             * 监控并处理房间的资源需求
             * @param {string} roomName - 房间名称
             */
            run(roomName) {
                const room = Game.rooms[roomName];
                const terminal = room.terminal;
                const storage = room.storage;
                if (!terminal || !storage) return;
        
                // // 动态生成资源规则
                // this.defineRules(roomName);
        
                // const resourceRules = Memory.rooms[roomName].resourceRules || [];
                // const resourceSources = Memory.resourceSources || {};
        
                // // 遍历资源规则，逐条检查和处理
                // for (const rule of resourceRules) {
                //     const { type, amount, mod, channel } = rule;
                //     const currentAmount = (terminal.store[type] || 0) + (storage.store[type] || 0);
                //     if (mod === 'get' && currentAmount < amount) {
                //         this.handleDeficit(type, amount - currentAmount, channel, roomName, resourceSources);
                //     } else if (mod === 'put' && currentAmount > amount) {
                //         this.handleSurplus(type, currentAmount - amount, channel, roomName, resourceSources);
                //     }
                // }
        
                // 本房间内资源平衡
                this.balanceResources(roomName);
            },
        
            /**
             * 动态生成资源规则
             * @param {string} roomName - 房间名称
             */
            defineRules(roomName) {
                const room = Game.rooms[roomName];
                const terminal = room.terminal;
                const storage = room.storage;
                if (!terminal || !storage) return;
        
                const resourceRules = [];
                const resources = new Set([
                    ...Object.keys(terminal.store),
                    ...Object.keys(storage.store),
                ]);
        
                const thresholds = {
                    energy: { critical: 50000, surplus: 500000 }, // 能量
                    X: { critical: 1000, surplus: 30000 },        // XLHZUO 等元素
                    L: { critical: 1000, surplus: 30000 },
                    H: { critical: 1000, surplus: 30000 },
                    Z: { critical: 1000, surplus: 30000 },
                    O: { critical: 1000, surplus: 30000 },
                    'power': { critical: 1000, surplus: 3000 },
                    default: { critical: 1000, surplus: 30000 },  // 默认资源规则
                };
        
                for (const resourceType of resources) {
                    const totalAmount = (terminal.store[resourceType] || 0) + (storage.store[resourceType] || 0);
                    const { critical, surplus } = thresholds[resourceType] || thresholds.default;
        
                    if (critical && totalAmount < critical) {
                        resourceRules.push({
                            type: resourceType,
                            amount: critical,
                            mod: 'get',
                            channel: 'share',
                        });
                    }
        
                    if (surplus && totalAmount > surplus) {
                        resourceRules.push({
                            type: resourceType,
                            amount: surplus,
                            mod: 'put',
                            channel: 'share',
                        });
                    }
                }
        
                if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
                Memory.rooms[roomName].resourceRules = resourceRules;
        
                console.log(`[资源规则] 房间 ${roomName} 的规则已更新:`, JSON.stringify(resourceRules));
            },
        
            /**
             * 本房间内资源平衡
             * @param {string} roomName - 房间名称
             */
            balanceResources(roomName) {
                const room = Game.rooms[roomName];
                const tasksList = Memory.rooms[roomName].tasks;
                const terminal = room.terminal;
                const storage = room.storage;
                if (!terminal || !storage) return;
        
                const thresholds = {
                    energy: 50000,  // 示例：终端需要保持的能量存储量
                    X: 3000,         // 示例：其他资源终端的目标存储量
                    L: 3000,
                    H: 3000,
                    Z: 3000,
                    O: 3000,
                    power: 3000,
                    default: 0,
                };
        
                for (const resourceType of new Set([...Object.keys(terminal.store), ...Object.keys(storage.store)])) {
                    const terminalAmount = terminal.store[resourceType] || 0;
                    const storageAmount = storage.store[resourceType] || 0;
                    const targetAmount = thresholds[resourceType] || thresholds.default;
                    if (terminalAmount < targetAmount) {
                        const transferAmount = Math.min(targetAmount - terminalAmount, storageAmount);
                        if (transferAmount > 0) {
                            console.log(`<font color="red">[资源平衡]</font> 房间 ${roomName} 从Storage转移 ${transferAmount} ${resourceType} 到Terminal`);
                            //this.addTransferTask('S', 'T', resourceType, transferAmount,tasksList);
                        }
                    } else if (terminalAmount > targetAmount) {
                        const transferAmount = terminalAmount - targetAmount;
                        console.log(`<font color="green">[资源平衡]</font> 房间 ${roomName} 从Terminal转移 ${transferAmount} ${resourceType} 到Storage`);
                        //this.addTransferTask('T', 'S', resourceType, transferAmount,tasksList);
                    }
                }
            },
        
            /**
             * 处理资源短缺逻辑
             */
            handleDeficit(resourceType, deficit, channel, roomName, resourceSources) {
                switch (channel) {
                    case 'share': {
                        const response = this.shareRequest(resourceType, deficit, roomName, resourceSources);
                        if (response) {
                            console.log(`[资源管理] 房间 ${roomName} 获取到共享资源 ${deficit} ${resourceType}`);
                        } else {
                            console.log(`[资源管理] 房间 ${roomName} 未能获取到共享资源 ${deficit} ${resourceType}`);
                        }
                        break;
                    }
                    default:
                        console.log(`[资源管理] 未知物流渠道: ${channel}`);
                }
            },
        
            /**
             * 尝试向能提供资源的房间派发共享任务
             */
            shareRequest(resourceType, deficit, requestingRoom, resourceSources) {
                if (!resourceSources[resourceType]) return false;
        
                for (const roomName of resourceSources[resourceType]) {
                    if (roomName !== requestingRoom) {
                        console.log(`[资源共享] 房间 ${roomName} 提供 ${deficit} ${resourceType} 资源给房间 ${requestingRoom}`);
                        const task = {
                            type: 'share',
                            details: {
                                mod: 'put',
                                room: requestingRoom,
                                number: deficit,
                                resourceType: resourceType,
                            },
                        };
                        const tasksList = Memory.rooms[roomName].tasks || (Memory.rooms[roomName].tasks = []);
                        const isTaskExists = tasksList.some(existingTask => 
                            existingTask.type === 'share' &&
                            existingTask.details.room === requestingRoom &&
                            existingTask.details.resourceType === resourceType &&
                            existingTask.details.number === deficit
                        );
                        if (!isTaskExists) {
                            tasksList.push(task);
                            console.log(`[资源共享] 已为房间 ${roomName} 创建资源共享任务`);
                            return true;
                        } else {
                            console.log(`[资源共享] 房间 ${roomName} 已经有相同的共享任务，不再重复添加`);
                            return false;
                        }
                    }
                }
                return false;
            },
        
            /**
             * 处理资源过剩逻辑
             */
            handleSurplus(resourceType, surplus, channel, roomName, resourceSources) {
                if (!resourceSources[resourceType]) {
                    resourceSources[resourceType] = [];
                }
                if (!resourceSources[resourceType].includes(roomName)) {
                    resourceSources[resourceType].push(roomName);
                }
                switch (channel) {
                    case 'take': {
                        console.log(`[资源管理] 房间 ${roomName} 向市场出售 ${surplus} ${resourceType}`);
                        break;
                    }
                    case 'share': {
                        console.log(`[资源管理] 房间 ${roomName} 提供共享 ${surplus} ${resourceType}`);
                        break;
                    }
                    case 'release': {
                        console.log(`[资源管理] 房间 ${roomName} 挂单出售 ${surplus} ${resourceType}`);
                        break;
                    }
                    default:
                        console.log(`[资源管理] 未知物流渠道: ${channel}`);
                }
            },
        
            addTransferTask(from, to, resourceType, amount, tasksList) {
                console.log(`[任务管理] 添加转移任务: 从 ${from} 到 ${to} 资源 ${resourceType} 数量 ${amount}`);
                const isTaskExists = tasksList.some(task => 
                    task.type === 'S-T' &&
                    task.detail.from === from && 
                    task.detail.to === to && 
                    task.detail.resourceType === resourceType && 
                    task.detail.amount === amount
                );
        
                if (!isTaskExists) {
                    tasksList.push({
                        type: 'S-T',
                        detail: {
                            from,
                            to,
                            resourceType,
                            amount
                        }
                    });
                    console.log(`[任务管理] 已成功添加转移任务: 从 ${from} 到 ${to}，资源 ${resourceType} 数量 ${amount}`);
                } else {
                    console.log(`[任务管理] 转移任务已存在，未重复添加`);
                }
            },
        };
        const roleCentralTransferer = {
            /**
             * 中央转运者主要运行逻辑
             * @param {Creep} creep - 需要运行逻辑的 Creep
             */
            run(creep) {
                creep.memory.dontPullMe = true; // 防止被拉动
        
                const roomMemory = Memory.rooms[creep.room.name];
                const targetPosition = this.getTargetPosition(creep.room.name);
        
                if (!creep.pos.isEqualTo(targetPosition)) {
                    creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ffaa00', opacity: 0.5, lineStyle: 'dashed' } });
                } else {
                    this.manageEnergy(creep, roomMemory);
                }
            },
        
            /**
             * 获取目标位置
             * @param {string} roomName 房间名称
             * @returns {RoomPosition} 目标位置
             */
            getTargetPosition(roomName) {
                const positions = {
                    'E54N19': new RoomPosition(5, 9, roomName),
                    'E56N13': new RoomPosition(43, 16, roomName),
                    'E53N19': new RoomPosition(11, 38, roomName),
                    'E55N21': new RoomPosition(6, 20, roomName),
                    'E56N17': new RoomPosition(35, 21, roomName),
                    'E55N9': new RoomPosition(31, 4, roomName),
                    'E58N14': new RoomPosition(26, 29, roomName)
                };
                return positions[roomName] || null;
            },
        
            /**
             * 管理房间内 Terminal 和 Storage 的能量平衡
             * @param {Creep} creep
             * @param {Object} roomMemory
             */
            manageEnergy(creep, roomMemory) {
                const { terminal, storage } = creep.room;
                const centerLink = creep.room[roomMemory.centerLinkId];
                const tasksList = roomMemory.tasks;
        
                this.ensureRelevantResources(creep, storage, tasksList);
        
                const taskHandlers = {
                    'S-T': this.handleSTask,
                    'share': this.handleShareTask,
                    'transferToUpgradeLink': this.handleUpgradeLinkTask,
                    'transferToStorage': this.handleStorageTask
                };
        
                for (const taskType in taskHandlers) {
                    const task = tasksList.find(task => task.type === taskType);
                    if (task) {
                        console.log(task.type)
                        taskHandlers[taskType].call(this, creep, tasksList, storage, terminal, centerLink);
                        break;
                    }
                }
            },
        
            /**
             * 确保 Creep 只持有任务所需的资源
             * @param {Creep} creep
             * @param {StructureStorage} storage
             * @param {Array} tasksList
             */
            ensureRelevantResources(creep, storage, tasksList) {
                const currentTask = tasksList.find(task =>
                    ['S-T', 'share', 'transferToUpgradeLink', 'transferToStorage'].includes(task.type));
        
                if (!currentTask) return;
        
                const allowedResource = ['S-T', 'share'].includes(currentTask.type)
                    ? currentTask.details.resourceType
                    : RESOURCE_ENERGY;
        
                for (const resourceType in creep.store) {
                    if (resourceType !== allowedResource) {
                        creep.transfer(storage, resourceType);
                        return;
                    }
                }
            },
        
            /**
             * 处理共享任务
             */
            handleShareTask(creep, tasks, storage, terminal) {
                const task = tasks.find(task => task.type === 'share');
                if (!task || !storage || !terminal) return;
        
                const { resourceType, number, cost, room } = task.details;
                const remaining = number - (terminal.store[resourceType] || 0);
        
                if (remaining > 0) {
                    this.transferBetweenStructures(creep, storage, terminal, resourceType, remaining);
                } else if (terminal.store[RESOURCE_ENERGY] < cost) {
                    this.transferBetweenStructures(creep, storage, terminal, RESOURCE_ENERGY, cost - terminal.store[RESOURCE_ENERGY]);
                } else if (terminal.send(resourceType, number, room, '这是礼物') === OK) {
                    console.log(`[资源共享] 任务完成: ${number} ${resourceType} 已发送到房间 ${room}`);
                    this.completeTaskById(tasks, task.Id);
                }
            },
        
            /**
             * 处理 S-T 任务
             */
            handleSTask(creep, tasks) {
                const task = tasks.find(task => task.type === 'S-T');
                if (!task) return;
        
                const { from, to, resourceType, amount } = task.details;
                const source = creep.room[from];
                const target = creep.room[to];
        
                if (!source || !target) {
                    this.completeTaskById(tasks, task.Id);
                    return;
                }
        
                const transferAmount = Math.min(amount, creep.store.getCapacity(resourceType));
                if (creep.store[resourceType] === 0) {
                    creep.withdraw(source, resourceType, transferAmount);
                } else if (creep.transfer(target, resourceType, transferAmount) === OK) {
                    task.details.amount -= transferAmount;
                    if (task.details.amount <= 0) this.completeTaskById(tasks, task.Id);
                }
            },
        
            /**
             * 处理升级链接任务
             */
            handleUpgradeLinkTask(creep, tasks, storage, _, centerLink) {
                if (!centerLink) return;
        
                if (centerLink.store[RESOURCE_ENERGY] < 799) {
                    this.transferBetweenStructures(creep, storage, centerLink, RESOURCE_ENERGY);
                } else {
                    this.completeTaskByType(tasks, 'transferToUpgradeLink');
                }
            },
        
            /**
             * 处理储存器任务
             */
            handleStorageTask(creep, tasks, _, centerLink, storage) {
                if (!centerLink) return;
        
                if (centerLink.store[RESOURCE_ENERGY] > 0 || creep.store[RESOURCE_ENERGY] > 0) {
                    this.transferBetweenStructures(creep, centerLink, storage, RESOURCE_ENERGY);
                } else {
                    this.completeTaskByType(tasks, 'transferToStorage');
                }
            },
        
            /**
             * 通用资源转移逻辑
             */
            transferBetweenStructures(creep, source, target, resourceType, amount) {
                if (creep.store[resourceType] === 0) {
                    creep.withdraw(source, resourceType, amount);
                } else {
                    creep.transfer(target, resourceType, amount);
                }
            },
        
            /**
             * 根据任务类型完成任务
             */
            completeTaskByType(tasks, taskType) {
                const index = tasks.findIndex(task => task.type === taskType);
                if (index !== -1) tasks.splice(index, 1);
            },
        
            /**
             * 根据任务 ID 完成任务
             */
            completeTaskById(tasks, taskId) {
                const index = tasks.findIndex(task => task.Id === taskId);
                if (index !== -1) tasks.splice(index, 1);
            }
        };
        
        
        