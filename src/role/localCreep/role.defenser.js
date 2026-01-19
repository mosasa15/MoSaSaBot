var roledefenser = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        if( creep.memory.boosted === false ){
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
                    if(creep.room.name === 'E55N9'){
                        boostLab = labs[5];  
                        boostType = ATTACK;  
                        break;  
                    } else {
                        boostLab = labs[1];  
                        boostType = ATTACK;  
                        break;  
                    }
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
            if( true ) {
                const roomName = creep.room.name;
                // 查找当前房间的所有 rampart
                const ramparts = creep.room.rampart;
                // 如果没有 rampart，则直接返回或执行其他逻辑
                if (ramparts.length === 0) {
                    // 可以添加日志或其他处理逻辑
                    return;
                }
                // 查找当前房间的所有敌对 creep
                const hostileCreeps = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
                // 如果没有敌对 creep，也可以考虑是否继续执行或返回
                if (hostileCreeps.length === 0) {
                    // 可以添加日志或其他处理逻辑
                    return;
                }
                
                // 初始化最近的 rampart 和其距离
                let closestRampart = null;
                let minDistance = Infinity;
                
                // 遍历每个 rampart，找到距离敌人最近的 rampart
                for (const rampart of ramparts) {
                    let minEnemyDistance = Infinity;
                    const distance = rampart.pos.getRangeTo(hostileCreeps[0].pos);
                    if (distance < minEnemyDistance) {
                        minEnemyDistance = distance;
                    }
                    const totalDistance = minEnemyDistance;
                    if (totalDistance < minDistance) {
                        minDistance = totalDistance;
                        closestRampart = rampart;
                    }
                }
                
                // 如果有找到最近的 rampart，则前往该位置
                if (closestRampart) {
                    creep.moveTo(closestRampart.pos, { visualizePathStyle: { stroke: '#ff0000' } });
                } else {
                }
                const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if(target) {
                    // creep.attack(target)
                        // 检查 creep 是否携带 ATTACK 部件
                    const hasAttackPart = creep.body.some(part => part.type === ATTACK);
                    // 检查 creep 是否携带 RANGED_ATTACK 部件
                    const hasRangedAttackPart = creep.body.some(part => part.type === RANGED_ATTACK);
                
                    // 根据携带的部件类型进行攻击
                    if (hasAttackPart && !hasRangedAttackPart || // 如果有 ATTACK 且没有 RANGED_ATTACK
                        (hasAttackPart && hasRangedAttackPart && creep.pos.getRangeTo(target) <= 3)) { // 或者两者都有但距离足够近以进行近战
                        creep.attack(target);
                    } else if (hasRangedAttackPart) { // 如果有 RANGED_ATTACK
                        creep.rangedAttack(target);
                    }
                }
                const flag = Game.flags[creep.memory.flagName];
                if(flag && (creep.ticksToLive < 10 || creep.hits < 200)){
                    Game.flags[creep.memory.flagName].remove();
                }
            } else {
                if(!creep.memory.flagName){
                    const flagName = generateRandomFlagName();
                    const room = Game.rooms[creep.room.name];
                    const flagPosition = new RoomPosition(
                        25,
                        25,
                        room.name
                    );
                    Game.flags[flagName] = flagPosition;
                    creep.memory.flagName = flagName;
                    Game.rooms[creep.room.name].createFlag( flagPosition.x, flagPosition.y, flagName );
                } 
                const flag = Game.flags[creep.memory.flagName];
                if ( flag ) {
                    // const targets = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);  
                    // if (targets.length > 0) {  
                    //     if (targets.length === 1) {  
                    //         creep.rangedAttack(targets[0]); 
                    //     } else {  
                    //         creep.rangedMassAttack();  
                    //     }  
                    // }
                    const roomName = flag.pos.roomName;  
                    const position = this.getPositionInMatrix(creep.memory.workLoc);
                    const targetX = flag.pos.x + position.x;
                    const targetY = flag.pos.y + position.y;
                    const targetPosition = new RoomPosition(targetX, targetY, roomName);  
                    if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y) {
                        const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                        if(target) {
                            // creep.attack(target)
                                // 检查 creep 是否携带 ATTACK 部件
                            const hasAttackPart = creep.body.some(part => part.type === ATTACK);
                            // 检查 creep 是否携带 RANGED_ATTACK 部件
                            const hasRangedAttackPart = creep.body.some(part => part.type === RANGED_ATTACK);
                        
                            // 根据携带的部件类型进行攻击
                            if (hasAttackPart && !hasRangedAttackPart || // 如果有 ATTACK 且没有 RANGED_ATTACK
                                (hasAttackPart && hasRangedAttackPart && creep.pos.getRangeTo(target) <= 3)) { // 或者两者都有但距离足够近以进行近战
                                creep.attack(target);
                            } else if (hasRangedAttackPart) { // 如果有 RANGED_ATTACK
                                creep.rangedAttack(target);
                            }
                        
                        }
                    }
                    creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
                    const flag = Game.flags[creep.memory.flagName];
                    if(flag && (creep.ticksToLive < 10 || creep.hits < 200)){
                        Game.flags[creep.memory.flagName].remove();
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

// const TERRAIN_MASK_WALL = 1; // 假设这是自然墙的标识
// const RoomDangerAreaType = {
//     safe: 0,
//     wall: 1,
//     constructedWall: 2,
//     rampart: 3,
//     outside: 4,
//     inside: 5,
// };

// class RoomTerrain {
//     constructor(width, height) {
//         this.terrain = Array.from({ length: width }, () => Array(height).fill(0));
//     }
//     get(x, y) {
//         return this.terrain[x] ? this.terrain[x][y] : null;
//     }
//     set(x, y, value) {
//         if (this.terrain[x]) {
//             this.terrain[x][y] = value;
//         }
//     }
// }

// class RoomArray {
//     constructor(width, height) {
//         this.dangerArea = Array.from({ length: width }, () => Array(height).fill(RoomDangerAreaType.safe));
//     }
//     get(x, y) {
//         return this.dangerArea[x] ? this.dangerArea[x][y] : RoomDangerAreaType.safe;
//     }
//     set(x, y, value) {
//         if (this.dangerArea[x]) {
//             this.dangerArea[x][y] = value;
//         }
//     }
//     forEachNear(x, y, callback) {
//         const directions = [
//             [-1, -1], [-1, 0], [-1, 1],
//             [ 0, -1],           [0, 1],
//             [ 1, -1],  [1, 0],  [1, 1],
//         ];
//         for (const [dx, dy] of directions) {
//             const nx = x + dx;
//             const ny = y + dy;
//             callback(nx, ny, this.get(nx, ny));
//         }
//     }
// }

// function outOfRange(x, y, width = 50, height = 50) { // 默认宽度和高度为50，可以根据需要调整
//     return x < 0 || x >= width || y < 0 || y >= height;
// }

// class RampartController {
//     static dfs(x, y, dangerArea, terrain, rampartPosSet, constructedWallPosSet) {
//         if (outOfRange(x, y)) return;
//         if (
//             terrain.get(x, y) === TERRAIN_MASK_WALL ||
//             rampartPosSet.has(`${x}/${y}`) ||
//             constructedWallPosSet.has(`${x}/${y}`)
//         ) {
//             if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
//                 dangerArea.set(x, y, RoomDangerAreaType.wall);
//             } else if (constructedWallPosSet.has(`${x}/${y}`)) {
//                 dangerArea.set(x, y, RoomDangerAreaType.constructedWall);
//             }
//             for (let i = -2; i <= 2; i++) {
//                 for (let j = -2; j <= 2; j++) {
//                     const xx = x + i;
//                     const yy = y + j;
//                     if (dangerArea.get(xx, yy) !== RoomDangerAreaType.safe || outOfRange(xx, yy)) continue;
//                     dangerArea.set(xx, yy, RoomDangerAreaType.inside);
//                 }
//             }
//             return;
//         }
//         dangerArea.set(x, y, RoomDangerAreaType.outside);
//         dangerArea.forEachNear(x, y, (xx, yy, val) => {
//             if (val === RoomDangerAreaType.safe || val === RoomDangerAreaType.inside) {
//                 RampartController.dfs(xx, yy, dangerArea, terrain, rampartPosSet, constructedWallPosSet);
//             }
//         });
//     }
//     static getDangerArea(roomWidth, roomHeight, terrain, rampartPosSet, constructedWallPosSet) {
//         const dangerArea = new RoomArray(roomWidth, roomHeight);
//         RampartController.dfs(roomWidth - 1, roomHeight - 1, dangerArea, terrain, rampartPosSet, constructedWallPosSet); // 从房间出口开始搜索
//         return {
//             get: (x, y) => dangerArea.get(x, y),
//         };
//     }
// }

// function findClosestPosByXY(targetX, targetY, positions) {
//     // 找到一个位置，该位置是给定位置列表中距离目标位置（targetX, targetY）最近的一个
//     // 这里使用简单的欧几里得距离计算
//     let closestPos = null;
//     let minDistance = Infinity;
//     positions.forEach(pos => {
//         const distance = Math.sqrt(Math.pow(pos.x - targetX, 2) + Math.pow(pos.y - targetY, 2));
//         if (distance < minDistance) {
//             minDistance = distance;
//             closestPos = pos;
//         }
//     });
//     return closestPos;
// }

// // DefenseTaskManager 类的定义
// class DefenseTaskManager {
//     static freeRampart = {};
//     static getFreeRampart(room) {
//         if (DefenseTaskManager.freeRampart[room.name] && DefenseTaskManager.freeRampart[room.name].time < Game.time) {
//             delete DefenseTaskManager.freeRampart[room.name];
//         }
//         if (DefenseTaskManager.freeRampart[room.name] && DefenseTaskManager.freeRampart[room.name].pos) {
//             return DefenseTaskManager.freeRampart[room.name].pos;
//         }
//         const dangerArea = RampartController.getDangerArea(room);
//         const freeRampart = [];
//         if (room.rampart) {
//             room.rampart.forEach(rampart => {
//                 const pos = rampart.pos;
//                 if (dangerArea.get(pos.x, pos.y) !== RoomDangerAreaType.rampart) return;
//                 const structs = pos.lookFor(LOOK_STRUCTURES); // 确保LOOK_STRUCTURES在您的环境中已定义
//                 if (structs.some(s => !['road', 'container', 'rampart'].includes(s.structureType))) return;
//                 freeRampart.push(pos);
//             });
//         }
//         DefenseTaskManager.freeRampart[room.name] = {
//             time: Game.time + 63,
//             pos: freeRampart,
//         };
//         return freeRampart;
//     }
//     static getNearestFreeRampart(room, usedPosSet, targetPos) {
//         const freeRampart = DefenseTaskManager.getFreeRampart(room).filter(
//             pos => !usedPosSet.has(`${pos.x}/${pos.y}`)
//         );
//         if (!freeRampart.length) return null;
//         const nearestPos = findClosestPosByXY(targetPos.x, targetPos.y, freeRampart);
//         if (!nearestPos) return null;
//         usedPosSet.add(`${nearestPos.x}/${nearestPos.y}`);
//         return nearestPos;
//     }
// }

export default roledefenser;
