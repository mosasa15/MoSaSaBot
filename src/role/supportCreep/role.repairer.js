var roleRepairer = {  
    /** @param {Creep} creep **/
    run: function(creep) {
        //const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        if( false ){
           const labs = creep.room.lab;  
            // 检查 creep.memory 中是否有 boostIndex，如果没有则初始化为 0  
            if (!creep.memory.boostIndex) {  
                creep.memory.boostIndex = 0;  
            }  
            // 根据 boostIndex 获取对应的实验室和强化类型  
            let boostLab, boostType;  
            switch (creep.memory.boostIndex) {  
                // case 0:  
                //     boostLab = labs[2];  
                //     boostType = MOVE;  
                //     break; 
                // case 1:  
                //     boostLab = labs[1];  
                //     boostType = RANGED_ATTACK;  
                //     break;  
                case 0:  
                    boostLab = labs[0];  
                    boostType = HEAL;  
                    break;  
                case 1:  
                    boostLab = labs[3];  
                    boostType = TOUGH;  
                    break;  
                default:  
                    // 如果 boostIndex 超出范围，重置为 0  
                    creep.memory.boostIndex = 0;  
                    boostLab = labs[0];  
                    boostType = HEAL;  
            }  
            // 执行 boostCreep 操作  
            const result = boostLab.boostCreep(creep, boostType);  
            if (result === OK) {  
                // 如果当前是最后一次强化，设置 boosted 为 true  
                if (creep.memory.boostIndex === 1) {  
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
        } else {
            // if ( (creep.hits < creep.hitsMax || creep.ticksToLive < 200)  && !tasksList.some(task => task.type === 'delaySpawn' && task.details.some(detail => detail.room === creep.memory.sourceRoomName) ) ) {
            //     creep.say('我要凉了?');
            //     tasksList.push({             // 暂时禁止重生
            //         type:'delaySpawn',
            //         details: [
            //             {
            //                 triggerTime: Game.time + 6000,
            //                 room: creep.memory.sourceRoomName,
            //             }
            //         ]
            //     });
            // }
            const flag = Game.flags['Flag5'];
            if ( flag ) {
                //creep.heal(creep);
                // 如果creep不在rampart上，则移动到rampart
                //const controller = creep.room['5bbcaf849099fc012e63ab40'];
                // console.log(controller.ticksToDowngrade)
                if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y && creep.room.name === flag.pos.roomName) {
                    if( false ) {
                        if(creep.attackController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.controller);
                        }
                    } else if(creep.room.controller) {
                        // if(controller.ticksToDowngrade < 19000){
                        //     controller.unclaim();
                        // }
                        if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(creep.room.controller);
                        }
                        // if(creep.room.controller && !creep.room.controller.my) {
                        //     if(creep.attackController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        //         creep.moveTo(creep.room.controller);
                        //     }
                        // }
                        // if(creep.signController(creep.room.controller, "要想过此路，留下买命财") == ERR_NOT_IN_RANGE) {
                        //     creep.moveTo(creep.room.controller);
                        // }
                    }
                } else {
                    creep.moveTo(flag, { visualizePathStyle: { stroke: '#ff0000' } });
                }
            } 
        }
    }
}

export default roleRepairer;