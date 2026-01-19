import InsectNameManager from '@/module/creepNameManager'; // 导入InsectNameManager

var E53N1 = {  
    run: function( roomName ) { 
        const startCpu = Game.cpu.getUsed(); // 记录开始时的CPU时间
        try{
        var sourceRooms = ['E53N1','E53N2','E52N1']; 
        var targetRooms = ['E53N1',];
        let room = Game.rooms[roomName];
        const spawns = room.spawn;
        const firstSpawn = spawns[0];
        // var mineral = room.mineral; 
        // var isSpawning = spawn => spawn.spawning !== null;
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

        // const terminal = room.terminal;
        // const storage = room.storage
        // const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;  
        // const storageEnergy = storage.store[RESOURCE_ENERGY] || 0;  
        // const totalEnergy = terminalEnergy + storageEnergy;
        if (firstSpawn.room.energyAvailable < 750 && !tasksList.some(task => task.type === 'fillExtension')) {  
            // 推送 'fillExtension' 任务  
            tasksList.push({ type: 'fillExtension' });  
            console.log(`房间 ${firstSpawn.room.name} 能量不足，已推送 fillExtension 任务。`);  
            return; // 如果需要立即退出后续代码，可以取消注释这行  
        }
        
        //———————————————————————————————————————————————————————————————————主房间运维组——————————————————————————————————————————————————————————————————————————————————————————
        var mainRoomRoleConfigs = [     //主房间运维组
            { role: 'manager',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 2, priority: 10},
            { role: 'transferer',       sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [2],     maxNumber: 0, priority: 9}, 
            
            { role: 'harvester',        sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [1,0],   maxNumber: 0, priority: 8},  
            { role: 'upgrader',         sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 2, priority: 7}, 
            { role: 'builder',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 6},
            { role: 'claimer',          sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [1],     maxNumber: 0, priority: 5},   
            //{ role: 'repairer',         sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [1],     maxNumber: 0, priority: 6}, //兼职挖
            //{ role: 'scavenger',        sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 6},
            // { role: 'attacker',         sourceRoom: sourceRooms[2], targetRoom: targetRooms[2], workLoc: [0],     maxNumber: 1, priority: 5}, 
            // { role: 'attacker',         sourceRoom: sourceRooms[1], targetRoom: targetRooms[1], workLoc: [0],     maxNumber: 1, priority: 5}, 
            { role: 'adventurer',       sourceRoom: sourceRooms[0], targetRoom: targetRooms[3], workLoc: [1,0],     maxNumber: 0, priority: 5},  
            { role: 'deposit_A',        sourceRoom: sourceRooms[4], targetRoom: targetRooms[0], workLoc: [1],     maxNumber: 0, priority: 5},  
            { role: 'deposit_B',        sourceRoom: sourceRooms[4], targetRoom: targetRooms[0], workLoc: [1],     maxNumber: 0, priority: 5}, 
            { role: 'reserveController',sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 9}, 
            { role: 'reserveController',sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 9}, 
            { role: 'Newbuilder',       sourceRoom: sourceRooms[2], targetRoom: targetRooms[1], workLoc: [0],     maxNumber: 0, priority: 1},  

            { role: 'adventurer',       sourceRoom: sourceRooms[5], targetRoom: targetRooms[4], workLoc: [0],     maxNumber: 0, priority: 5},    
            { role: 'Newbuilder',       sourceRoom: sourceRooms[1], targetRoom: targetRooms[1], workLoc: [0],     maxNumber: 0, priority: 1},  
            { role: 'Newbuilder',       sourceRoom: sourceRooms[2], targetRoom: targetRooms[1], workLoc: [1,0],   maxNumber: 0, priority: 1},          
            { role: 'Centraltransferer',sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 4}, 
        ];
        mainRoomRoleConfigs.sort((a, b) => a.priority - b.priority) // 先按优先级排序
        
        //———————————————————————————————————————————————————————————————————Spawn生产前提————————————————————————————————————————————————————————————————————————————————————————
        // //———————————————————————————————————————————————————————————————————主房间所管辖外矿生产——————————————————————————————————————————————————————————————————————————————————
        // for (let spawn of spawns) {
        //     if (isSpawning(spawn)) {
        //         continue;
        //     }
        //     for (let config of remoteMiningRoleConfigs) {
        //         // /---------------------处理delaySpawn任务------------------------------------------
        //         if (processDelaySpawnTasks(tasksList, config, firstSpawn)) {
        //             continue; // 如果存在未触发的delaySpawn任务，跳过当前配置
        //         } 
        //         //---------------------处理SpawnReserveController任务--------------------------------
        //         if (processClearCoreTasks(tasksList, config, firstSpawn)) {
        //             // 如果存在与配置匹配的任务，生产reserveController Creep
        //             if (checkCreepLimit('attacker', config.sourceRoom, config.targetRoom, null, 1)) {
        //                 spawnCreep(spawn, 'attacker', config.sourceRoom, config.targetRoom, null, createCreepBody('attacker'));
        //                 // 移除已处理的任务
        //             }
        //             continue; // 如果成功生产Creep，跳过当前配置
        //         }
        //         //---------------------处理SpawnReserveController任务--------------------------------
        //         if (processSpawnReserveControllerTasks(tasksList, config, firstSpawn)) {
        //             // 如果存在与配置匹配的任务，生产reserveController Creep
        //             if (checkCreepLimit('reserveController', config.sourceRoom, config.targetRoom, null, 1)) {
        //                 spawnCreep(spawn, 'reserveController', config.sourceRoom, config.targetRoom, null, createCreepBody('reserveController'));
        //                 // 移除已处理的任务
        //             }
        //             continue; // 如果成功生产Creep，跳过当前配置
        //         }
        //         //==============================正常生产外矿运维组角色=====================================
        //         for (let workLoc of config.workLoc) {
        //             if (checkCreepLimit(config.role, config.sourceRoom, config.targetRoom, workLoc, config.maxNumber)) {
        //                 spawnCreep(spawn, config.role, config.sourceRoom, config.targetRoom, workLoc, createCreepBody(config.role));
        //                 break; // 如果成功生产Creep，退出循环
        //             }
        //         }
        //     }
        // }
        //———————————————————————————————————————————————————————————————————主房间生产——————————————————————————————————————————————————————————————————————————————————
        // if (firstSpawn.room.energyAvailable < 2800) {  
        //     if (checkCreepLimit('manager', sourceRooms[0], targetRooms[0], 0, 1)) {
        //         spawnCreep(spawns[0], 'manager', sourceRooms[0], targetRooms[0], 0, createCreepBody('manager_2'));
        //     }
        // }
        // if (firstSpawn.room.controller.ticksToDowngrade < 90000) {  
        //     if (checkCreepLimit('upgrader', sourceRooms[0], targetRooms[0], 0, 1)) {
        //         spawnCreep(spawns[1], 'upgrader', sourceRooms[0], targetRooms[0], 0, createCreepBody('upgrader'));
        //     }
        // }
        // if(tasksList.some(task => task.type === 'repair')){
        //     for (let spawn of spawns) { //遍历所有spawn 
        //         if (checkCreepLimit('builder', sourceRooms[0], targetRooms[0], 0, 1)) {
        //             spawnCreep(spawn, 'builder', sourceRooms[0], targetRooms[0], 0, createCreepBody('builder'));
        //         }
        //     }
        // } 
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
        // if( totalEnergy >= 100000 ){
        //     for (let spawn of spawns) { //遍历所有spawn 
        //         if (checkCreepLimit('builder', sourceRooms[0], targetRooms[0], 0, 1)) {
        //             spawnCreep(spawn, 'builder', sourceRooms[0], targetRooms[0], 0, createCreepBody('builder'));
        //         }
        //     }
        // } 
        // console.log(flag.room.name)
        // if( flag ){
        //     for (let spawn of spawns) { //遍历所有spawn 
        //         if (checkCreepLimit('power_A', flag.room.name, targetRooms[0], 0, 3)) {
        //             spawnCreep(spawn, 'power_A', flag.room.name, targetRooms[0], 0, createCreepBody('power_A'));
        //         }
        //         if (checkCreepLimit('power_B', flag.room.name, targetRooms[0], 0, 3)) {
        //             spawnCreep(spawn, 'power_B', flag.room.name, targetRooms[0], 0, createCreepBody('power_B'));
        //         }
        //     }
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
                        // if (isSpawning(spawn)) { // 如果当前孵化器正在生产，则跳过剩余的生产任务
                        //     break;
                        // }
                    }
                }
                // if (isSpawning(spawn)) { // 如果当前孵化器正在生产，则跳过剩余的配置
                //     break;
                // }
            }
        }
        //—————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————————

    
        // // 显示正在生成的Creep的信息
        // if(Game.spawns['E53N19'].spawning) { // 孵化过程可视化
        //     var spawningCreep = Game.creeps[Game.spawns['E53N19'].spawning.name];
        //     Game.spawns['E53N19'].room.visual.text(
        //         '🛠️' + spawningCreep.memory.role,
        //         Game.spawns['E53N19'].pos.x + 1, 
        //         Game.spawns['E53N19'].pos.y, 
        //         {align: 'left', opacity: 0.8});
        // }
        } finally {
            // // CPU消耗统计
            // const usedCpu = Game.cpu.getUsed() - startCpu;
            // console.log(`[CPU] ${roomName} 模块消耗: ${usedCpu.toFixed(2)}`);

            // // 记录历史数据（保留最近100个tick）
            // if (!Memory.cpuStats) Memory.cpuStats = {};
            // if (!Memory.cpuStats[roomName]) {
            //     Memory.cpuStats[roomName] = {
            //         history: [],
            //         max: 0,
            //         average: 0
            //     };
            // }
            
            // const stats = Memory.cpuStats[roomName];
            // stats.history.push(usedCpu);
            // if (stats.history.length > 100) stats.history.shift();
            
            // // 计算最大值和平均值
            // stats.max = Math.max(...stats.history);
            // stats.average = stats.history.reduce((a, b) => a + b, 0) / stats.history.length;
            
            // // 预警提示（当单次消耗超过3.5或平均超过2时）
            // if (usedCpu > 3.5) {
            //     console.log(`⚠️ [CPU警告] ${roomName} 单次CPU消耗过高：${usedCpu.toFixed(2)}`);
            // }
            // if (stats.average > 2) {
            //     console.log(`⚠️ [CPU警告] ${roomName} 平均CPU消耗过高：${stats.average.toFixed(2)}`);
            // }
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
        case 'deposit_A':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'deposit_B':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'harvester 2':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK]; 
            break;
        case 'power_A':  
            body = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE];  
            break;  
        case 'power_B':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,MOVE];  
            break;  
        case 'power_C':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;   
        case 'transferer':  
            body = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];  
            break;  
        case 'claimer':  
            body = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];  
            break;  
        case 'adventurer':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break; 
        case 'manager':  
            body = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE];  
            break;  
        case 'upgrader':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY];  
            break;  
        case 'builder':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY];  
            break;  
        case 'repairer':  
            body = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,MOVE];  
            break;  
        case 'reserveController':  
            body = [MOVE,MOVE,CLAIM,CLAIM];  
            break;  
        case 'Newbuilder':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Centraltransferer':  
            body = [MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
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
        //     console.log(`成功 生产 ${newName} as a ${role}`);  
        // } else {  
        //     console.log(`失败 生产 ${role} creep: ${result}`);  
        // }  
        
    } 
}

// function spawnCreep(spawn, role, sourceRoom, targetRoom, workLoc, body) {
//     // 检查spawn是否正在生成其他creep
//     if (!spawn.spawning) {
//         // 构造优雅的Creep名称
//         const timestamp = Game.time.toString().slice(-3); // 保留时间戳后4位
//         const locationTag = workLoc ? workLoc[0].toUpperCase() : "X"; // 工作位置首字母，默认"X"
//         const roomTag = sourceRoom ? sourceRoom.slice(-2) : "XX"; // 房间名后2位，默认"XX"
//         const newName = `${role}-${roomTag}${locationTag}-${timestamp}`;
//         // 尝试生成Creep
//         const result = spawn.spawnCreep(body, newName, {
//             memory: {
//                 role,
//                 sourceRoomName: sourceRoom,
//                 targetRoomName: targetRoom,
//                 workLoc
//             }
//         });
//     } 
// }


export default E53N1;
