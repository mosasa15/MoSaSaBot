// @ts-nocheck
var roleclaimer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        if(  false ){
            const labs = creep.room.lab;  

            // 检查 creep.memory 中是否有 boostIndex，如果没有则初始化为 0  
            if (!creep.memory.boostIndex) {  
                creep.memory.boostIndex = 0;  
            }  
            // 根据 boostIndex 获取对应的实验室和强化类型  
            let boostLab, boostType;  
            switch (creep.memory.boostIndex) {  
                case 0:  
                    boostLab = labs[2];  
                    boostType = MOVE;  
                    break; 
                case 1:  
                    boostLab = labs[5];  
                    boostType = ATTACK;  
                    break;  
                //case 2:  
                //    boostLab = labs[0];  
                 //   boostType = HEAL;  
                 //   break;  
               // case 3:  
             //       boostLab = labs[3];  
          //          boostType = TOUGH;  
           //         break;  
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
            if(!creep.memory.flagName){
            const flagName = generateRandomFlagName();
            const room = Game.rooms[creep.room.name];
            const flagPosition = new RoomPosition(
                17,
                12,
                room.name
            );
            Game.flags[flagName] = flagPosition;
            creep.memory.flagName = flagName;
            Game.rooms[creep.room.name].createFlag( flagPosition.x, flagPosition.y, flagName );
        } 
            if ( Game.flags[creep.memory.flagName] ) {
                if ( false ) {
                    const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
                    if(targets.length > 0) {
                        creep.rangedAttack(targets[0]);
                    } 
                } else {
                    // creep.heal(creep);
                    const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);  
                    if (targets.length > 0) {  
                        creep.attack(targets[0]); 
                    }
                    var flag = Game.flags[creep.memory.flagName];
                    if( flag ){
                        const powerbanks = Game.rooms[creep.room.name].find(FIND_STRUCTURES, {
                            filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
                        });
                        const roomName = flag.pos.roomName;  
                        const position = this.getPositionInMatrix(creep.memory.workLoc);
                        const targetX = flag.pos.x + position.x;
                        const targetY = flag.pos.y + position.y;
                        const targetPosition = new RoomPosition(targetX, targetY, roomName);  
                        if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y) {
                            const target = powerbanks[0];
                            if(target && creep.hits > creep.hitsMax * 0.6) {
                                creep.attack(target);
                            }
                        }
                        creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
                        if(flag && (creep.ticksToLive < 10 || creep.hits < 200)){
                            Game.flags[creep.memory.flagName].remove();
                        }
                    }
                    const target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                        filter: function(object) {
                            return object.hits < object.hitsMax;
                        }
                    });
                    if(target) {
                        creep.heal(target)
                    } else {
                        creep.heal(creep);
                    }
                }
            } 
            creep.notifyWhenAttacked(false);
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
}

function generateRandomFlagName() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 5; i++) { // 生成一个10字符长的随机字符串
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export default roleclaimer;
