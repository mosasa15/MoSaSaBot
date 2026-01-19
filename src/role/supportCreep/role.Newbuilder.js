const roleNewBuilder = {
    /**
     * 主运行函数
     * @param {Creep} creep - 当前操作的 Creep 对象
     */
    run(creep) {
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        if( !creep.memory.boosted ){
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
                // case 0:  
                //     boostLab = labs[0];  
                //     boostType = MOVE;  
                //     break;  
                case 0:  
                    boostLab = labs[1];  
                    boostType = WORK;  
                    break;  
                case 1:
                    boostLab = labs[2];
                    boostType = CARRY;
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
            if (!creep.memory.prepare) {
                creep.memory.prepare = false;
            }
    
            if (!creep.memory.prepare && creep.memory.boosted === true) {
                this.prepare(creep);
                return;
            }
    
            this.toggleState(creep);
    
            if (creep.memory.harvesting) {
                creep.memory.dontPullMe = true;
                this.harvestEnergy(creep);
            } else {
                creep.memory.dontPullMe = true;
                this.work(creep);
            }
        }

    },

    /**
     * 切换工作状态
     * @param {Creep} creep
     */
    toggleState(creep) {
        if (creep.memory.harvesting && creep.store.getFreeCapacity() === 0) {
            creep.memory.harvesting = false;
        }
        if (!creep.memory.harvesting && creep.store[RESOURCE_ENERGY] === 0) {
            creep.memory.harvesting = true;
        }
    },

    /**
     * 准备阶段
     * @param {Creep} creep
     */
    prepare(creep) {
        // 路径点处理逻辑
        // 获取所有以'path_'开头的旗帜，并按数字顺序排序（如path_1, path_2, path_3...）
        const pathFlags = _.filter(Game.flags, flag => 
            flag.name.startsWith('path_') && 
            /path_\d+/.test(flag.name)
        ).sort((a, b) => {
            const aNum = parseInt(a.name.split('_')[1]);
            const bNum = parseInt(b.name.split('_')[1]);
            return aNum - bNum;
        });

        // 获取终点旗帜（名为'end'的旗帜）
        //const endFlag = Game.flags.end;
        // 从 memory 中获取当前路径点索引，如果没有则为0
        const currentIndex = creep.memory.pathIndex || 0;

        // 按顺序移动通过路径点
        if (pathFlags.length > 0 && currentIndex < pathFlags.length) {
            const targetFlag = pathFlags[currentIndex];
            // 如果到达当前路径点附近，则移动到下一个路径点
            if (creep.room.name === targetFlag.pos.roomName && 
                creep.pos.isNearTo(targetFlag.pos)) {
                creep.memory.pathIndex = currentIndex + 1;
            } else {
                // 否则继续移动到当前路径点
                creep.moveTo(targetFlag.pos, {
                    visualizePathStyle: {stroke: '#ffaa00'},
                    reusePath: 5  // 路径重用，提高性能
                });
            }
            return;
        }

        // // 终点处理逻辑
        // if (endFlag) {
        //     if (creep.room.name !== endFlag.pos.roomName || 
        //         !creep.pos.isNearTo(endFlag.pos)) {
        //         creep.moveTo(endFlag.pos, {
        //             visualizePathStyle: {stroke: '#ffaa00'},
        //             reusePath: 5
        //         });
        //         return;
        //     }
        // }

        // 初始化工作参数
        if (!creep.memory.targetSource) {
            if(creep.room.name === creep.memory.sourceRoomName){
                const sources = creep.room.source;
                creep.memory.targetSource = sources[creep.memory.workLoc].id;
            } else {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { 
                    visualizePathStyle: { stroke: '#ffaa00' } 
                });
                return; 
            }
        }
        
        if (creep.memory.hasConstructionSites === undefined) {
            creep.memory.hasConstructionSites = 
                creep.room.find(FIND_CONSTRUCTION_SITES).length > 0;
        }

        creep.memory.prepare = true;
    },

    /**
     * 收集能量阶段
     * @param {Creep} creep
     */
    harvestEnergy(creep) {
        const sourceRoomName = creep.memory.sourceRoomName;
        const targetSource = Game.getObjectById(creep.memory.targetSource);
        const storage = creep.room.storage;
        //const container = creep.room.container;

        if (creep.room.name !== sourceRoomName) {
            creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { 
                visualizePathStyle: { stroke: '#ffaa00' } 
            });
            return;
        }

        // // 使用 find 方法搜索有能量的废墟
        // const ruins = creep.room.find(FIND_RUINS, {
        //     filter: ruin => ruin.store[RESOURCE_ENERGY] > 0
        // });
        // if (ruins.length > 0 ) {
        //     const closestRuin = creep.pos.findClosestByRange(ruins);
        //     if (closestRuin) {
        //         if (creep.withdraw(closestRuin, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //             creep.moveTo(closestRuin, { 
        //                 visualizePathStyle: { stroke: '#ffffff' },
        //                 reusePath: 5
        //             });
        //         }
        //     }
        // } else 
        // if (storage && creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //     creep.moveTo(storage, { 
        //         visualizePathStyle: { stroke: '#ffffff' },
        //         reusePath: 5
        //     });
        // } else 
        if (targetSource && creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetSource, { 
                visualizePathStyle: { stroke: '#ffaa00' },
                reusePath: 5
            });
        }
    },

    /**
     * 工作阶段
     * @param {Creep} creep
     */
    work(creep) {
        const targetRoomName = creep.memory.targetRoomName;
        const sourceRoomName = creep.memory.sourceRoomName;

        // if (creep.room.name === sourceRoomName && creep.memory.hasConstructionSites) {
        //     this.buildClosestConstructionSite(creep);
        // } else 
        if (creep.room.name !== targetRoomName) {
            this.repairRoad(creep);
            creep.moveTo(new RoomPosition(25, 25, targetRoomName), { visualizePathStyle: { stroke: '#00aaff' } });
        } else {
            if (creep.memory.hasConstructionSites === undefined) {
                creep.memory.hasConstructionSites = creep.room.find(FIND_CONSTRUCTION_SITES).length > 0;
            }
            if (creep.memory.hasConstructionSites) {
                //this.buildClosestConstructionSite(creep);
                this.handleEnergyDelivery(creep);
            } else {
                this.handleEnergyDelivery(creep);
            }
        }
    },

    /**
     * 修复脚下的道路
     * @param {Creep} creep
     */
    repairRoad(creep) {
        const road = creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_ROAD);
        if (road && road.hits < road.hitsMax) {
            creep.repair(road);
        }
    },

    /**
     * 构建最近的建筑工地
     * @param {Creep} creep
     */
    buildClosestConstructionSite(creep) {
        const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        const closestTarget = creep.pos.findClosestByPath(targets);
        if (closestTarget) {
            if (creep.build(closestTarget) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestTarget, { visualizePathStyle: { stroke: '#ffffff' } });
            }
        } else {
            creep.memory.hasConstructionSites = false;
        }
    },

    
    /**
     * 移动到指定旗帜
     * @param {Creep} powerCreep 
     */
    moveToFlag(creep, flag, target) {
        const targetX = flag.pos.x ;
        const targetY = flag.pos.y ;
        const roomName = flag.pos.roomName;  
        const targetPosition = new RoomPosition(targetX, targetY, roomName);  
        creep.moveTo(targetPosition, {visualizePathStyle: {stroke: '#ffaa00'}});
        if( !creep.pos.isEqualTo(targetPosition) ){
        } else{
            creep.repair(target);
        }
    },

    /**
     * 处理能量运输逻辑
     * @param {Creep} creep
     */
    handleEnergyDelivery(creep) {
        const storage = creep.room.storage;
        const towers = creep.room.tower.filter(tower => 
            tower.store.getUsedCapacity(RESOURCE_ENERGY) < tower.store.getCapacity(RESOURCE_ENERGY) * 0.7
        );  // 找出能量低于70%的塔

        // 优先填充 Tower
        if (towers.length > 0) {
            const tower = creep.pos.findClosestByRange(towers);
            if (creep.transfer(tower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(tower, {
                    visualizePathStyle: {stroke: '#ff88ff'},
                    reusePath: 5
                });
            }
            return;
        }

        // 最后升级控制器
        const controller = creep.room.controller;
        if (controller && controller.ticksToDowngrade < 50000) {
            if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                creep.moveTo(controller, {
                    visualizePathStyle: {stroke: '#ffff00'},
                    reusePath: 5
                });
            }
        } else if (storage && storage.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(storage, {
                    visualizePathStyle: {stroke: '#ffffff'},
                    reusePath: 5
                });
            }
            return;
        }

    }
};

export default roleNewBuilder;

