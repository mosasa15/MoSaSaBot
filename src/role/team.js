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
                // case 0:  
                    // boostLab = labs[0];  
                    // boostType = HEAL;  
                    // break;  
                case 0:  
                    boostLab = labs[2];  
                    boostType = MOVE;   
                    break;  
                case 1:  
                    boostLab = labs[4];  
                    boostType = WORK; 
                    break;  
                case 2:  
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
                    if (creep.memory.boostIndex === 2) {  
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
                    boostLab = labs[2];  
                    boostType = MOVE; 
                    break;  
                // case 1:  
                //     boostLab = labs[1];  
                //     boostType = RANGED_ATTACK;  
                //     break;  
                case 1:  
                    boostLab = labs[0];  
                    boostType = HEAL;  
                    break;  
                case 2:  
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
                    if (creep.memory.boostIndex === 2) {  
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
                // const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
                // const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
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
                    // const target = creep.room['5e1d052035f1a580bb2d5c7b'];
                    // creep.dismantle(target);


                    // const flag = Game.flags['X'];
                    // if (flag) {
                    //     // 检查 creep 是否在 flag 附近一格
                    //     if (creep.pos.inRangeTo(flag.pos, 1)) {
                    //         // 查找 flag 所在位置的结构
                    //         const structureAtFlag = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos);
                    //         const hasWorkPart = creep.body.some(part => part.type === WORK);
                    //         // 如果存在敌方的 Rampart 或 Wall，并且 creep 有 WORK 部件
                    //         if ( hasWorkPart) {
                    //             console.log('dismantle')
                    //             // 尝试拆除该结构
                    //             creep.dismantle(structureAtFlag[0]);
                    //         }
                    //     } 
                    // }
                }
                const flag = Game.flags['X'];
                    if (flag) {
                        // 检查 creep 是否在 flag 附近一格
                        if (creep.pos.inRangeTo(flag.pos, 1)) {
                            // 查找 flag 所在位置的结构
                            const structureAtFlag = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos);
                            const hasWorkPart = creep.body.some(part => part.type === WORK);
                            // 如果存在敌方的 Rampart 或 Wall，并且 creep 有 WORK 部件
                            if ( hasWorkPart) {
                                console.log('dismantle')
                                // 尝试拆除该结构
                                creep.dismantle(structureAtFlag[0]);
                            }
                        } 
                        
                    }
                // const target = creep.room['5e1d052035f1a580bb2d5c7b'];
                // creep.dismantle(target);
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
                    if( brother ){
                        if( brother.hits < brother.hitsMax ){
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

    // // 获取creep在方阵中的位置
    // S: function(workLoc) {
    //     // 假设方阵的每个单位距离为1
    //     const positions = [
    //         { x: 0, y: 0 }, // workLoc 0
    //         { x: 1, y: 0 },  // workLoc 1
    //         { x: 0, y: -1 },  // workLoc 2
    //         { x: 0, y: -1 }   // workLoc 3
    //     ];
    //     return positions[workLoc];
    // },
    // // 获取creep在方阵中的位置
    // D: function(workLoc) {
    //     // 假设方阵的每个单位距离为1
    //     const positions = [
    //         { x: 0, y: 0 }, // workLoc 0
    //         { x: 0, y: 1 },  // workLoc 1
    //         { x: -1, y: 0 },  // workLoc 2
    //         { x: -1, y: 1 }   // workLoc 3
    //     ];
    //     return positions[workLoc];
    // },
    // // 获取creep在方阵中的位置
    // W: function(workLoc) {
    //     // 假设方阵的每个单位距离为1
    //     const positions = [
    //         { x: 0, y: 0 }, // workLoc 0
    //         { x: 1, y: 0 },  // workLoc 1
    //         { x: 0, y: 1 },  // workLoc 2
    //         { x: 1, y: 1 }   // workLoc 3
    //     ];
    //     return positions[workLoc];
    // },
};
export default team;