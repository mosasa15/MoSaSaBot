import InsectNameManager from '@/module/creepNameManager'; // 导入InsectNameManager

var E56N13 = {  
    run: function(roomName) {  
        
        var sourceRooms = ['E56N13','E55N13','E57N13','E55N9','E54N9','E55N11','E58N14','E58N13','E59N14','E59N13','E58N15']; 
        var targetRooms = ['E56N13','E55N13','E57N13','E55N9','E54N9','E55N11','E58N14','E58N13','E59N14','E59N13','E58N15']; 
        let room = Game.rooms[roomName];
        const spawns = room.spawn;
        const firstSpawn = spawns[0];
        var mineral = room.mineral; 
        var isSpawning = spawn => spawn.spawning !== null;
        var roomMemory = Memory.rooms[firstSpawn.room.name];
        
        // 首先检查 roomMemory 和 tasks 数组是否存在  
        if (!roomMemory || !roomMemory.tasks) {  
            // 如果 roomMemory 不存在，则初始化它  
            if (!roomMemory) {  
                Memory.rooms[firstSpawn.room.name] = {};  
                roomMemory = Memory.rooms[firstSpawn.room.name];  
            }  
            // 如果 tasks 数组不存在，则初始化它  
            if (!roomMemory.tasks) {  
                roomMemory.tasks = [];  
            }  
        }  
        var tasksList = Memory.rooms[firstSpawn.room.name].tasks;
        const terminal = room.terminal;
        const storage = room.storage
        const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;  
        const storageEnergy = storage.store[RESOURCE_ENERGY] || 0;  
        const totalEnergy = terminalEnergy + storageEnergy;
        if (firstSpawn.room.energyAvailable < 6450 && !tasksList.some(task => task.type === 'fillExtension')) {  
            // 推送 'fillExtension' 任务  
            tasksList.push({ type: 'fillExtension' });  
            console.log(`房间 ${firstSpawn.room.name} 能量不足，已推送 fillExtension 任务。`);  
            return; // 如果需要立即退出后续代码，可以取消注释这行  
        }
        //———————————————————————————————————————————————————————————————————主房间运维组——————————————————————————————————————————————————————————————————————————————————————————

        var mainRoomRoleConfigs = [     //主房间运维组
            { role: 'manager',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 10},   //priority 越大越优先生产 workLoc 越靠后越优先生产
            { role: 'harvester',        sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 9},    //priority 相同的时候，排名靠下优先生产
            { role: 'transferer',       sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [2],     maxNumber: 0, priority: 8}, 
            { role: 'upgrader',         sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 7}, 
            { role: 'builder',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 6},
            //{ role: 'scavenger',        sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 6},
            { role: 'adventurer',       sourceRoom: sourceRooms[10], targetRoom: targetRooms[6], workLoc: [0],     maxNumber: 0, priority: 5},   
            { role: 'claimer',          sourceRoom: sourceRooms[5], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 5},    
            { role: 'thinker',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [3],     maxNumber: 0, priority: 9},
            { role: 'defenser',         sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 9},

            { role: 'Newbuilder',       sourceRoom: sourceRooms[6], targetRoom: targetRooms[6], workLoc: [1,0],   maxNumber: 0, priority: 6}, 
            { role: 'Newbuilder',       sourceRoom: sourceRooms[7], targetRoom: targetRooms[6], workLoc: [0],   maxNumber: 0, priority: 6}, 
            { role: 'Newbuilder',       sourceRoom: sourceRooms[8], targetRoom: targetRooms[6], workLoc: [0],   maxNumber: 0, priority: 6}, 
            { role: 'Newbuilder',       sourceRoom: sourceRooms[9], targetRoom: targetRooms[6], workLoc: [0],   maxNumber: 0, priority: 6}, 

            { role: 'scavenger',        sourceRoom: sourceRooms[6], targetRoom: targetRooms[6], workLoc: [0],     maxNumber: 0, priority: 6}, 
            { role: 'repairer',         sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [1],     maxNumber: 0, priority: 6}, 
            { role: 'Centraltransferer',sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 4}, 

            { role: 'Demolisher',       sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0,1],     maxNumber: 0, priority: 4}, 
            { role: 'Healer',           sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [2,3],     maxNumber: 0, priority: 4}, 
        ];
        mainRoomRoleConfigs.sort((a, b) => a.priority - b.priority) // 先按优先级排序
        //———————————————————————————————————————————————————————————————————主房间所管辖外矿运维组——————————————————————————————————————————————————————————————————————————————————
        var remoteMiningRoleConfigs = [  //外矿运维组
            //{ role: 'reserveController',sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 1}, 
            { role: 'Newtransferer',    sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 1},  
            { role: 'NewHarvester',     sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 1},  
            //{ role: 'attacker',         sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 2},    
            
            //{ role: 'reserveController',sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 2},  
            { role: 'Newtransferer',    sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [1],   maxNumber: 0, priority: 2},    
            { role: 'NewHarvester',     sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [1],   maxNumber: 0, priority: 2}, 
            //{ role: 'attacker',         sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 3}, 
        ];
        remoteMiningRoleConfigs.sort((a, b) => a.priority - b.priority)
        
        //———————————————————————————————————————————————————————————————————主房间所管辖外矿生产——————————————————————————————————————————————————————————————————————————————————
        for (let spawn of spawns) {
            if (isSpawning(spawn)) {
                continue;
            }
            for (let config of remoteMiningRoleConfigs) {
                // /---------------------处理delaySpawn任务------------------------------------------
                if (processDelaySpawnTasks(tasksList, config, firstSpawn)) {
                    continue; // 如果存在未触发的delaySpawn任务，跳过当前配置
                } 
                //---------------------处理SpawnReserveController任务--------------------------------
                if (processClearCoreTasks(tasksList, config, firstSpawn)) {
                    // 如果存在与配置匹配的任务，生产reserveController Creep
                    if (checkCreepLimit('attacker', config.sourceRoom, config.targetRoom, null, 1)) {
                        spawnCreep(spawn, 'attacker', config.sourceRoom, config.targetRoom, null, createCreepBody('attacker'));
                        // 移除已处理的任务
                    }
                    continue; // 如果成功生产Creep，跳过当前配置
                }
                //---------------------处理SpawnReserveController任务--------------------------------
                if (processSpawnReserveControllerTasks(tasksList, config, firstSpawn)) {
                    // 如果存在与配置匹配的任务，生产reserveController Creep
                    if (checkCreepLimit('reserveController', config.sourceRoom, config.targetRoom, null, 1)) {
                        spawnCreep(spawn, 'reserveController', config.sourceRoom, config.targetRoom, null, createCreepBody('reserveController'));
                        // 移除已处理的任务
                    }
                    continue; // 如果成功生产Creep，跳过当前配置
                }
                //==============================正常生产外矿运维组角色=====================================
                for (let workLoc of config.workLoc) {
                    if (checkCreepLimit(config.role, config.sourceRoom, config.targetRoom, workLoc, config.maxNumber)) {
                        spawnCreep(spawn, config.role, config.sourceRoom, config.targetRoom, workLoc, createCreepBody(config.role));
                        break; // 如果成功生产Creep，退出循环
                    }
                }
            }
        }

        //———————————————————————————————————————————————————————————————————主房间生产——————————————————————————————————————————————————————————————————————————————————
        if (firstSpawn.room.energyAvailable < 2800) {  
            if (checkCreepLimit('manager', sourceRooms[0], targetRooms[0], 0, 1)) {
                spawnCreep(spawns[0], 'manager', sourceRooms[0], targetRooms[0], 0, createCreepBody('manager_2'));
            }
        }
        if (firstSpawn.room.controller.ticksToDowngrade < 90000) {  
            if (checkCreepLimit('upgrader', sourceRooms[0], targetRooms[0], 0, 1)) {
                spawnCreep(spawns[1], 'upgrader', sourceRooms[0], targetRooms[0], 0, createCreepBody('upgrader'));
            }
        }
        if(tasksList.some(task => task.type === 'spawn')){
            if (checkCreepLimit('defenser', sourceRooms[0], targetRooms[0], 0, 1)) {
                spawnCreep(spawns[2], 'defenser', sourceRooms[0], targetRooms[0], 0, createCreepBody('defenser'));
            }
        } 
        // if(tasksList.some(task => task.type === 'repair')){
        //     for (let spawn of spawns) { //遍历所有spawn 
        //         if (checkCreepLimit('builder', sourceRooms[0], targetRooms[0], 0, 1)) {
        //             spawnCreep(spawn, 'builder', sourceRooms[0], targetRooms[0], 0, createCreepBody('builder'));
        //         }
        //     }
        // } 
        if( totalEnergy >= 300000 ){
            for (let spawn of spawns) { //遍历所有spawn 
                if (checkCreepLimit('builder', sourceRooms[0], targetRooms[0], 0, 1)) {
                    spawnCreep(spawn, 'builder', sourceRooms[0], targetRooms[0], 0, createCreepBody('builder'));
                }
            }
        } 
        // if (mineral.ticksToRegeneration === undefined  ) {  
        //     for (let spawn of spawns) { //遍历所有spawn 
        //         if (checkCreepLimit('harvester', sourceRooms[0], targetRooms[0], 2, 1)) {
        //             spawnCreep(spawn, 'harvester', sourceRooms[0], targetRooms[0], 2, createCreepBody('harvester 2'));
        //         }
        //         if (checkCreepLimit('transferer', sourceRooms[0], targetRooms[0], 0, 1)) {
        //             spawnCreep(spawn, 'transferer', sourceRooms[0], targetRooms[0], 0, createCreepBody('transferer'));
        //         }
        //     }
        //     // console.log('有矿快挖 ')
        // } 
        for (let spawn of spawns) { //遍历所有spawn                     
            for (let config of mainRoomRoleConfigs) { //每个spawn遍历运维组
                for (let workLoc of config.workLoc) {  //遍历运维组的每个workLoc
                    if (checkCreepLimit(config.role, config.sourceRoom, config.targetRoom, workLoc, config.maxNumber)) {
                        if (workLoc == 2 && config.role == 'harvester') {
                            spawnCreep(spawn, config.role, config.sourceRoom, config.targetRoom, workLoc, createCreepBody('harvester 2'));
                        } else {
                            spawnCreep(spawn, config.role, config.sourceRoom, config.targetRoom, workLoc, createCreepBody(config.role));
                        }
                        if (isSpawning(spawn)) { // 如果当前孵化器正在生产，则跳过剩余的生产任务
                            break;
                        }
                    }
                }
                if (isSpawning(spawn)) { // 如果当前孵化器正在生产，则跳过剩余的配置
                    break;
                }
            }
        }
        //—————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————
        
    
        // 显示正在生成的Creep的信息
        if(Game.spawns['E56N13'].spawning) { // 孵化过程可视化
            var spawningCreep = Game.creeps[Game.spawns['E56N13'].spawning.name];
            Game.spawns['E56N13'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['E56N13'].pos.x + 1, 
                Game.spawns['E56N13'].pos.y, 
                {align: 'left', opacity: 0.8});
        }   
    }  
};

function checkCreepLimit(role, sourceRoom, targetRoom, workLoc, maxNumber) {  
    let count = 0;  
    const creeps = Game.creeps; // 提前获取Game.creeps，减少在循环中的访问次数  
    // 遍历Game.creeps中的所有creep  
    for (const name in creeps) {  
        const creep = creeps[name]; // 存储当前creep的引用  
        // 检查creep的记忆是否与给定参数匹配  
        if (  
            creep.memory.role === role &&  
            creep.memory.sourceRoomName === sourceRoom &&  
            creep.memory.targetRoomName === targetRoom &&  
            creep.memory.workLoc === workLoc  
        ) {  
            count++; // 如果匹配，则计数器加一  
        }  
    }  
    // 返回当前数量是否小于最大数量  
    return count < maxNumber;  
}

function createCreepBody(role) {    //返回body
    let body;  
    switch (role) {  
        case 'harvester':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'harvester 2':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK]; 
                break; 
        case 'transferer':  
            body = [CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE];  
            break;  
        case 'manager':  
            body = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];  
            break;  
        case 'upgrader':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'builder':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY];  
            break;  
        case 'attacker':  
            body = [MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK];  
            break;  
        case 'adventurer':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Newtransferer':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Centraltransferer':  
            body = [MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'reserveController':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM];  
            break;  
        case 'claimer':
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];
            break;
        case 'NewHarvester':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Newbuilder':  
            body = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];  
            break;  
        case 'scavenger':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK];  
            break;  
        case 'repairer':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM]; 
            break;  
        case 'Demolisher':  
            body = [MOVE,WORK]; 
            break; 
        case 'defenser':
            body = [ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            break;
        case 'thinker':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Healer':  
            body = [TOUGH,MOVE]; 
            break;   
        default:  
            body = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];  
    }  
    return body;  
}


function spawnCreep(spawn, role, sourceRoom, targetRoom, workLoc, body) {  
    // 检查spawn是否正在生成其他creep  
    if (spawn.spawning === null) {  
        // 构造Creep的名称
        const roomName = spawn.room.name;
        let room = Game.rooms[roomName];
        let newName = InsectNameManager.registerName( room );  

        // 尝试生成Creep  
        const result = spawn.spawnCreep(body, newName, {  
            memory: {  
                role: role,  
                sourceRoomName: sourceRoom, 
                targetRoomName: targetRoom,  
                workLoc: workLoc  
            }  
        });  
        // 检查生成结果  
        // if (result === OK) {  
        //     console.log(`成功 生产 ${newName} 作为 ${role}`);  
        // } else {  
        //     console.log(`失败 生产 ${role} creep，失败原因是： ${result}，`);  
        // }   
        
    } 
}

// 在生产Creep之前，处理delaySpawn任务
function processDelaySpawnTasks(tasksList, config, firstSpawn) {
    const delaySpawnTasks = tasksList.filter(task => task.type === 'delaySpawn');
    for (const task of delaySpawnTasks) {
        const detail = task.details.find(detail => detail.room === config.sourceRoom);
        if (detail && Game.time >= detail.triggerTime) {
            // 触发时间已到，移除该任务
            Memory.rooms[firstSpawn.room.name].tasks = tasksList.filter(t => t !== task);
        } else if (detail) {
            // 如果存在未触发的delaySpawn任务，则不生产Creep
            return true;
        }
    }
    return false;
}

// 在生产Creep之前，处理clearCore任务
function processClearCoreTasks(tasksList, config, firstSpawn) {
    const clearCoreTasks = tasksList.filter(task => task.type === 'clearCore');
    for (const task of clearCoreTasks) {
        if (task.room === config.sourceRoom) {
            // 如果存在与配置匹配的任务，则处理该任务
            Memory.rooms[firstSpawn.room.name].tasks = tasksList.filter(t => t !== task);
            return true;
        }
    }
    return false;
}

function processSpawnReserveControllerTasks(tasksList, config, firstSpawn) {
    const spawnReserveControllerTasks = tasksList.filter(task => task.type === 'SpawnReserveController');
    for (const task of spawnReserveControllerTasks) {
        if (task.room === config.sourceRoom) {
            // 如果存在与配置匹配的任务，则生产reserveController Creep
            Memory.rooms[firstSpawn.room.name].tasks = tasksList.filter(t => t !== task);
            return true;
        }
    }
    return false;
}

export default E56N13;