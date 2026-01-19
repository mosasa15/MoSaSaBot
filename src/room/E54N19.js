import InsectNameManager from '@/module/creepNameManager'; // 导入InsectNameManager

var E54N19 = {  
    run: function(roomName) {  
        var sourceRooms = ['E54N19','E54N18','E55N18','E55N17','E53N19','E55N21','E56N17','E53N22','E53N17','E54N18','E49N19','E55N20','E50N16','E52N20','E56N20','E54N20','E57N20','']; 
        var targetRooms = ['E54N19','E54N18','E55N18','E55N17','E53N19','E55N21','E56N17','E53N22','E53N17','E54N18','E49N19','E55N21']; 
        let room = Game.rooms[roomName];
        // var mineral = room.mineral; 
        // console.log(mineral.ticksToRegeneration)
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
            { role: 'harvester',        sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [1,0],   maxNumber: 1, priority: 9},    //priority 相同的时候，排名靠下优先生产
            { role: 'transferer',       sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [2],     maxNumber: 0, priority: 8}, 
            { role: 'upgrader',         sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 7},
            { role: 'builder',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 6},
            { role: 'adventurer',       sourceRoom: sourceRooms[0], targetRoom: targetRooms[10], workLoc: [1,0],     maxNumber: 0, priority: 5},  
            //{ role: 'claimer',          sourceRoom: sourceRooms[7], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 5},    
            { role: 'Centraltransferer',sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 4},

            { role: 'deposit_A',        sourceRoom: sourceRooms[15], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 5},  
            { role: 'deposit_B',        sourceRoom: sourceRooms[15], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 5}, 
            { role: 'power_A',        sourceRoom: sourceRooms[16], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 4},  
            { role: 'power_B',        sourceRoom: sourceRooms[16], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 4},
            { role: 'power_C',        sourceRoom: sourceRooms[14], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 4},

            { role: 'thinker',          sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [3],     maxNumber: 0, priority: 9},
            { role: 'adventurer',       sourceRoom: sourceRooms[16], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 8},  
            
            { role: 'Newbuilder',       sourceRoom: 'E52N19', targetRoom: 'E51N18', workLoc: [0],   maxNumber: 0, priority: 6},  
            { role: 'Newbuilder',       sourceRoom: 'E52N18', targetRoom: 'E51N18', workLoc: [0],   maxNumber: 0, priority: 6},
            { role: 'Newbuilder',       sourceRoom: 'E51N17', targetRoom: 'E51N18', workLoc: [1,0],   maxNumber: 0, priority: 6},    

            { role: 'scavenger',        sourceRoom: sourceRooms[0], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 6},
            //{ role: 'harvester',         sourceRoom: sourceRooms[5], targetRoom: targetRooms[0], workLoc: [1,0],   maxNumber: 0, priority: 6},
        ];
        mainRoomRoleConfigs.sort((a, b) => a.priority - b.priority) // 先按优先级排序
        //———————————————————————————————————————————————————————————————————主房间所管辖外矿运维组——————————————————————————————————————————————————————————————————————————————————
        var remoteMiningRoleConfigs = [  //外矿运维组
            //{ role: 'reserveController',sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 1}, 
            //{ role: 'Newtransferer',    sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],      maxNumber: 0, priority: 1},    //E55N18
            //{ role: 'NewHarvester',     sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [1,0],    maxNumber: 0, priority: 1},  
            //{ role: 'attacker',         sourceRoom: sourceRooms[2], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 2},    
            
            //{ role: 'reserveController',sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 2},  
            { role: 'Newtransferer',    sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 2},    //E54N18
            { role: 'NewHarvester',     sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 0, priority: 2}, 
            //{ role: 'attacker',         sourceRoom: sourceRooms[1], targetRoom: targetRooms[0], workLoc: [0],     maxNumber: 1, priority: 3}, 
        ];
        remoteMiningRoleConfigs.sort((a, b) => a.priority - b.priority)
    
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
        // if(tasksList.some(task => task.type === 'repair')){
        //     for (let spawn of spawns) { //遍历所有spawn 
        //         if (checkCreepLimit('builder', sourceRooms[0], targetRooms[0], 0, 1)) {
        //             spawnCreep(spawn, 'builder', sourceRooms[0], targetRooms[0], 0, createCreepBody('builder'));
        //         }
        //     }
        // } 

        if( totalEnergy >= 300000 ){
            for (let spawn of spawns) { //遍历所有spawn 
                if (checkCreepLimit('builder', sourceRooms[0], targetRooms[0], 0, 2)) {
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
        if(tasksList.some(task => task.type === 'Powertransfer')){
            const Tasks = tasksList.filter(task => task.type === 'Powertransfer');  
            for( let task of Tasks){
                for (let spawn of spawns) { //遍历所有spawn 
                    if (checkCreepLimit('power_C', task.room, targetRooms[0], 0, task.number)) {
                        spawnCreep(spawn, 'power_C', task.room, targetRooms[0], 0, createCreepBody('power_C'));
                    }
                }
            }
        } 
        if(tasksList.some(task => task.type === 'Power')){
            const Tasks = tasksList.filter(task => task.type === 'Power');  
            for( let task of Tasks){
                const indices = Array.from({ length: task.number }, (_, i) => i);
                for (let spawn of spawns) { //遍历所有spawn 
                    for (let workLoc of indices) {  //遍历运维组的每个workLoc
                        if (checkCreepLimit('power_A', task.room, targetRooms[0], workLoc, 1)) {
                            spawnCreep(spawn, 'power_A', task.room, targetRooms[0], workLoc, createCreepBody('power_A'));
                        }
                        if (checkCreepLimit('power_B', task.room, targetRooms[0], workLoc, 1)) {
                            spawnCreep(spawn, 'power_B',task.room, targetRooms[0], workLoc, createCreepBody('power_B'));
                        }
                        if (task.assistance === true) {
                            if (checkCreepLimit('power_D', task.room, targetRooms[0], 0, 7)) { 
                                spawnCreep(spawn, 'power_D', task.room, targetRooms[0], 0, createCreepBody('power_D'));
                            }
                        }
                    }
                }
            }
        }
        if(tasksList.some(task => task.type === 'spawn')){
            if (checkCreepLimit('defenser', sourceRooms[0], targetRooms[0], 0, 1)) {
                spawnCreep(spawns[2], 'defenser', sourceRooms[0], targetRooms[0], 0, createCreepBody('defenser'));
            }
        } 
        for (let spawn of spawns) { //遍历所有spawn                     
            for (let config of mainRoomRoleConfigs) { //每个spawn遍历运维组
                for (let workLoc of config.workLoc) {  //遍历运维组的每个workLoc
                    if (checkCreepLimit(config.role, config.sourceRoom, config.targetRoom, workLoc, config.maxNumber)) {
                            spawnCreep(spawn, config.role, config.sourceRoom, config.targetRoom, workLoc, createCreepBody(config.role));
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
        if(Game.spawns['Spawn1'].spawning) { // 孵化过程可视化
            var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
            Game.spawns['Spawn1'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['Spawn1'].pos.x + 1, 
                Game.spawns['Spawn1'].pos.y, 
                {align: 'left', opacity: 0.8});
        }   

        if(Game.spawns['Spawn2'].spawning) { // 孵化过程可视化
            var spawningCreep = Game.creeps[Game.spawns['Spawn2'].spawning.name];
            Game.spawns['Spawn2'].room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                Game.spawns['Spawn2'].pos.x + 1, 
                Game.spawns['Spawn2'].pos.y, 
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
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK]; 
                break; 
        case 'transferer':  
            body = [CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,CARRY,CARRY,MOVE];  
            break;  
        case 'deposit_A':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'deposit_B':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'manager':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'upgrader':  
            body = [MOVE,WORK,CARRY];  
            break;  
        case 'power_A':  
            body = [ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE];  
            break;  
        case 'power_B':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,MOVE];  
            break;  
        case 'power_C':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'power_D':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,MOVE];  
            break;  
        case 'builder':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'attacker':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];  
            break;  
        case 'adventurer':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Newtransferer':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'scavenger':  
            body = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];  
            break;  
        case 'Centraltransferer':  
            body = [MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'reserveController':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM,CLAIM];  
            break;  
        case 'claimer':  
            body = [MOVE];  
            break; 
        case 'NewHarvester':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        case 'Newbuilder':  
            body = [WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            break;  
        case 'repairer':  
            body = [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE];  
            break;
        case 'thinker':  
            body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];  
            break;  
        default:  
            body = [CARRY,CARRY,MOVE,CARRY,CARRY,MOVE]; 
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

export default E54N19;