var roleAdventurer = {
    //-------------------------------------------------------------------------------------
    renew: function(creep, spawns) {
        // 检查creep的生命周期是否低于设定的阈值
        if (creep.ticksToLive < 1300) {
            if (spawns.length > 0) {
                const spawn = spawns[0]; // 选择第一个spawn，这里可以扩展为选择最佳spawn的逻辑
                if (spawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                    // 如果creep不在spawn范围内，则移动到spawn
                    creep.moveTo(spawn, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
        } else if (creep.memory.renewing && creep.ticksToLive > 1300) {
            // 如果creep的生命周期大于1300且处于renewing状态，则退出renewing状态
            creep.memory.renewing = false;
        }
    },

/**
 * @param {Creep} creep
 */
run: function(creep) {
    const sourceRoomName = creep.memory.sourceRoomName;
    const targetRoomName = creep.memory.targetRoomName;
    // creep.memory.dontPullMe = true;  
    // 初始化或更新状态
    if (!creep.memory.state) {
        creep.memory.state = 'COLLECT_RESOURCES';
    }
    
    switch (creep.memory.state) {
        case 'COLLECT_RESOURCES':
            creep.memory.dontPullMe = true;  
            // 如果creep不在源房间，则移动到源房间
            if (creep.room.name !== sourceRoomName) {
                creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });
                return;
            } else {
                const flag = Game.flags['Flag1'];
                // // 查找源房间内的storage
                // creep.moveTo(flag)
                const storage = creep.room.storage;
                const containers = creep.room.container;
                const powerbanks = Game.rooms[creep.room.name].find(FIND_STRUCTURES, {
                    filter: (structure) => structure.structureType === STRUCTURE_POWER_BANK
                });
                const ruins = creep.room.find(FIND_RUINS);
                const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES);
                const powerResources = droppedResources.find(resource => resource.resourceType === RESOURCE_POWER);

                if (creep.store[RESOURCE_POWER] === 0) {
                    const nearestPowerBank = powerbanks[0]; 
                    if( ruins.length > 0 ){
                        if (creep.withdraw(ruins[0], RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(ruins[0], { visualizePathStyle: { stroke: '#00ff00' } });
                        }
                    } else if( powerResources ){
                        if (creep.pickup(powerResources) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(powerResources, { visualizePathStyle: { stroke: '#0000ff' } });
                        }
                        // for (let resource of droppedResources) {
                        //     if (resource.resourceType === RESOURCE_POWER) {
                        //         if (creep.pickup(resource) === ERR_NOT_IN_RANGE) {
                        //             creep.moveTo(resource, { visualizePathStyle: { stroke: '#0000ff' } });
                        //         }
                        //     }
                        // }
                    } else {
                        if (!creep.pos.inRangeTo(nearestPowerBank, 3) ) { 
                            creep.moveTo(nearestPowerBank, { visualizePathStyle: { stroke: '#00ff00' } });
                        }
                        // creep.moveTo(flag)
                        for (let resourceType in creep.store) {
                            if (resourceType !== RESOURCE_POWER && creep.store[resourceType] > 0) {
                                creep.drop(resourceType);
                            }
                        }
                    }
                } else {
                    // 如果creep的背包满了，则切换到返回目标房间的状态
                    creep.memory.state = 'TRANSFER_RESOURCES';
                    break;
                }
            }
            break;
        case 'TRANSFER_RESOURCES':
            creep.memory.dontPullMe = false;  
            // 如果creep不在目标房间，则移动到目标房间
            if (creep.room.name !== targetRoomName) {
                creep.moveTo(new RoomPosition(25, 25, targetRoomName), { visualizePathStyle: { stroke: '#00aaff' } });
                return;
            } else {
                // 查找目标房间内的storage
                const storage = creep.room.storage;
                const terminal = creep.room.terminal;
                // const containers = creep.room.container;
                // const spawns = creep.room.spawn;
                //-------------------------------------------------------------------------------------
                // // 检查creep是否需要renew
                // if (creep.ticksToLive < 800 && !creep.memory.renewing) {
                //     // 设置creep为renewing状态
                //     creep.memory.renewing = true;
                // }
                // // 如果creep处于renewing状态，则尝试renew
                // if (creep.memory.renewing) {
                //     this.renew(creep, spawns);
                //     // 如果renew之后生命周期仍然低于1300，则不执行任务
                //     if (creep.ticksToLive < 1300) {
                //         return; // 结束函数执行，不执行任何任务
                //     }
                // }
                //-------------------------------------------------------------------------------------
                // if (creep.transfer(terminal, RESOURCE_POWER) === ERR_NOT_IN_RANGE) {
                //     creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ff0000' } });
                // }
                // 将creep背包中的所有资源转移到storage
                for (let resourceType in creep.store) {
                    if (creep.transfer(storage, resourceType) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ff0000' } });
                    }
                }
                // 如果creep的背包空了，则切换到收集资源的状态
                if (Object.keys(creep.store).length === 0) {
                    creep.memory.state = 'COLLECT_RESOURCES';
                }
            }
            break;
        }
    }
};
export default roleAdventurer;
