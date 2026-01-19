var roleManager = {  
    /**  
     * @param {Creep} creep - The creep to run logic for.  
     */  

    //-------------------------------------------------------------------------------------
    renew: function(creep, spawns) {
        // 检查creep的生命周期是否低于设定的阈值
        if (creep.ticksToLive < 1300 && creep.room.energyAvailable > 1000) {
            if (spawns.length > 0) {
                const targetSpawn = spawns[creep.memory.workLoc]; 
                if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                    // 如果creep不在spawn范围内，则移动到spawn
                    creep.moveTo(targetSpawn, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
        } else {
            // 如果creep的生命周期大于1300且处于renewing状态，则退出renewing状态
            creep.memory.renewing = false;
        }
    },
    //-------------------------------------------------------------------------------------
    run: function(creep) {
        // creep.memory.dontPullMe = true; 
        const tasksList = Memory.rooms[creep.room.name].tasks;
        const extensions = creep.room.extension;
        const towers = creep.room.tower;
        const spawns = creep.room.spawn;
        const labs = creep.room.lab;
        const powerSpawn = creep.room.powerSpawn;
        const storage = creep.room.storage;
        const terminal = creep.room.terminal;
        const links = creep.room.link;
        const Nuker = creep.room.nuker;
        const targetResource = 'XLH2O';
        const resourceTypes = ['XLHO2','XGHO2']; // 根据实际情况替换资源类型  
        // // 化合物所需的资源量（这里假设每个lab需要相同量的资源，但可以根据实际情况调整）  
        const requiredCompoundAmount = 360; 
        if ( false) {  
            const FullResourcesLabs = labs.filter(lab => lab.store[lab.mineralType] > 0);
            if( creep.store.getUsedCapacity() === 0 ){
                var closestTarget = FullResourcesLabs[0];
                if(closestTarget){
                    if(creep.withdraw(closestTarget, closestTarget.mineralType) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}}); 
                    }
                }
            } else {
                // 转移所有资源
                for(const resourceType in creep.store) {
                    if(creep.transfer(storage, resourceType) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                    }
                }
            }

            
            // const notFullEnergyLabs = labs.filter(lab => lab.store[RESOURCE_ENERGY] < 2000); 
            // if (notFullEnergyLabs.length > 0){
            //     if(creep.store[RESOURCE_ENERGY] === 0) {
            //         if(creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            //             creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
            //         }
            //     } else {
            //         var closestTarget = findClosestTarget(creep, notFullEnergyLabs);
            //         if (creep.transfer(closestTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            //             creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}})
            //         }
            //     }
            // } else {
            //     if(creep.store[RESOURCE_ENERGY] === 0) {
            //         for (let i = 0; i < resourceTypes.length && labs[i]; i++) {    
            //             const lab = labs[1];    
            //             const targetResource = resourceTypes[1];    
            //             // 检查lab是否存在  
            //             if (lab) {  
            //                 // 检查lab是否正在处理我们关心的矿物，并且化合物是否不足  
            //                 if ( lab.store[targetResource] < requiredCompoundAmount) {  
            //                     // 如果creep没有携带目标资源，尝试从terminal中提取  
            //                     if (creep.store[targetResource] === 0) {  
            //                         if (creep.withdraw(terminal, targetResource, 360) === ERR_NOT_IN_RANGE) {  
            //                             creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
            //                             // 提取后需要返回继续下面的逻辑，所以这里不break  
            //                         }  
            //                     // 如果creep已经携带了目标资源，直接尝试传输到lab  
            //                     } else {  
            //                         if (creep.transfer(lab, targetResource) === ERR_NOT_IN_RANGE) {  
            //                             creep.moveTo(lab, {visualizePathStyle: {stroke: '#ffffff'}});  
            //                         }  
            //                     }  
            //                     // 假设我们只关心第一个匹配的并且化合物不足的lab  
            //                     break;   
            //                 }  
            //             }  
            //         }  
            //     } else {
            //         if(creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            //             creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
            //         }
            //     }
            // } 
        } else 
        //-------------------------------------------------------------------------------------
        // // 检查creep是否需要renew
        // if (creep.ticksToLive < 500 && !creep.memory.renewing && creep.room.energyAvailable > 1000) {
        //     // 设置creep为renewing状态
        //     creep.memory.renewing = true;
        // }
        // // 如果creep处于renewing状态，则尝试renew
        // if (creep.memory.renewing) {
        //     this.renew(creep, spawns);
        //     // 如果renew之后生命周期仍然低于1300，则不执行任务
        //     if (creep.ticksToLive < 1300 && creep.room.energyAvailable > 1000) {
        //         return; // 结束函数执行，不执行任何任务
        //     }
        // }
        // else  //优先renew自己的TicksToLive值
        //-------------------------------------------------------------------------------------
        // if (Nuker.store[RESOURCE_ENERGY] < 300000) { // 检测 Nuker 的能量是否小于 300K
        //     if (creep.store[RESOURCE_ENERGY] === 0) {
        //         if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //             creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
        //         }
        //     } else {
        //         if (creep.transfer(Nuker, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //             creep.moveTo(Nuker, { visualizePathStyle: { stroke: '#ffffff' } });
        //         }
        //     }
        // } else if (Nuker.store[RESOURCE_GHODIUM] < 5000) { // 检测 Nuker 是否缺少 GHODIUM
        //     if (creep.store[RESOURCE_ENERGY] === 0) {
        //         if (creep.store[RESOURCE_GHODIUM] === 0) {
        //             if (creep.withdraw(terminal, RESOURCE_GHODIUM, 1000) === ERR_NOT_IN_RANGE) {
        //                 creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });
        //             }
        //         } else {
        //             if (creep.transfer(Nuker, RESOURCE_GHODIUM, 1000) === ERR_NOT_IN_RANGE) {
        //                 creep.moveTo(Nuker, { visualizePathStyle: { stroke: '#ffffff' } });
        //             }
        //         }
        //     } else {
        //         if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //             creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        //         }
        //     } 
        // }else 
        if(tasksList.some(task => task.type === 'boostGetResource')){
            if(creep.store[RESOURCE_ENERGY] === 0){
                fillLabsBoostSource(creep, tasksList,terminal);
            } else {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                }  
            }
        }  else
        if(tasksList.some(task => task.type === 'labGetEnergy')){
            fillLabsEnergy(creep, tasksList, labs, storage)
        } 
        else if(tasksList.some(task => task.type === 'withdraw')){
            if(creep.store[RESOURCE_ENERGY] === 0){
                getResource(creep, tasksList, labs, terminal);
            } else {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                }  
            }
        } 
        else if(tasksList.some(task => task.type === 'transfer')){
            if(creep.store[RESOURCE_ENERGY] === 0){
                putResource(creep, tasksList, labs, terminal);
            } else {
                if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
                }  
            }
        } 
        else if(tasksList.some(task => task.type === 'fillExtension')){
            if(creep.store[targetResource] === 0){
                fillExtensions(creep, tasksList, extensions, spawns, storage);
            } else {
                if (creep.transfer(terminal, targetResource) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                }  
            }
        } 
        else if(tasksList.some(task => task.type === 'fillTower')){  
            if(creep.store[targetResource] === 0){
                fillTowers(creep, tasksList, towers, storage);
            } else {
                if (creep.transfer(terminal, targetResource) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                }  
            }
        } 
        //-------------------------------------------------------------------------------------
        else if(powerSpawn && storage.store[RESOURCE_ENERGY] > 100000 && ( creep.room.name === 'E54N19')){
            // 检查powerSpawn是否需要能量
            if(powerSpawn.energy < powerSpawn.energyCapacity) {
                // 如果creep没有能量，从storage提取energy
                if(creep.store[RESOURCE_ENERGY] === 0) {
                    if(storage.store[RESOURCE_ENERGY] > 0) {
                        if(creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                        }
                    }
                } else {
                    // 如果creep有能量，转移到powerSpawn
                    if(creep.transfer(powerSpawn, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(powerSpawn, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            } else {
                // 检查powerSpawn是否需要power
                if(powerSpawn.power === 0) {
                    // 如果creep没有power，从storage提取power
                    if(creep.store[RESOURCE_POWER] === 0) {
                        if(creep.store[RESOURCE_ENERGY] > 0) {
                            if(creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                            }
                        } else if(creep.withdraw(terminal, RESOURCE_POWER, 100) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(terminal, {visualizePathStyle: {stroke: '#aa00ff'}});
                        }
                    } else {
                        // 如果creep有power，转移到powerSpawn
                        if(creep.transfer(powerSpawn, RESOURCE_POWER, 100) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(powerSpawn, {visualizePathStyle: {stroke: '#00ffff'}});
                        }
                    }
                }
            }
        }         
        // else  {
        //     // const terminal = creep.room.terminal;
        //     // const storage = creep.room.storage
        //     // const terminalEnergy = terminal.store[RESOURCE_ENERGY] || 0;  
        //     // const storageEnergy = storage.store[RESOURCE_ENERGY] || 0;  
        //     // const totalEnergy = terminalEnergy + storageEnergy;
            
        //         if (Nuker.store[RESOURCE_ENERGY] < 300000) { // 检测 Nuker 的能量是否小于 300K
        //             if (creep.store[RESOURCE_ENERGY] === 0) {
        //                 if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //                     creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });
        //                 }
        //             } else {
        //                 if (creep.transfer(Nuker, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //                     creep.moveTo(Nuker, { visualizePathStyle: { stroke: '#ffffff' } });
        //                 }
        //             }
        //         } else if (Nuker.store[RESOURCE_GHODIUM] < 5000) { // 检测 Nuker 是否缺少 GHODIUM
        //             if (creep.store[RESOURCE_ENERGY] === 0) {
        //                 if (creep.store[RESOURCE_GHODIUM] === 0) {
        //                     if (creep.withdraw(terminal, RESOURCE_GHODIUM, 1000) === ERR_NOT_IN_RANGE) {
        //                         creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });
        //                     }
        //                 } else {
        //                     if (creep.transfer(Nuker, RESOURCE_GHODIUM, 1000) === ERR_NOT_IN_RANGE) {
        //                         creep.moveTo(Nuker, { visualizePathStyle: { stroke: '#ffffff' } });
        //                     }
        //                 }
        //             } else {
        //                 if (creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        //                     creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff' } });
        //                 }
                        
        //             } 
        //         }
        //     }
        // //-------------------------------------------------------------------------------------
    }  
};  

function getResource(creep, tasks, labs, terminal){
    const getResourceTask = tasks.find(task => task.type === 'withdraw');  
    const targetResource = getResourceTask.resourceType;
    const targetAmount = Math.min(getResourceTask.amount, creep.store.getCapacity(targetResource));
    const targetLab = creep.room[getResourceTask.labId];

    if(getResourceTask.amount > 0 && creep.store[targetResource] === 0){
        if(creep.withdraw(terminal, targetResource, targetAmount) === ERR_NOT_IN_RANGE){
            creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffffff' } }); 
        };
    } else if(getResourceTask.amount === 0){
        Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'withdraw');
    }
    if(creep.store[targetResource] > 0){
        let err = creep.transfer(targetLab, targetResource);
        if( err === ERR_NOT_IN_RANGE ){
            creep.moveTo(targetLab, {visualizePathStyle: {stroke: '#ffffff'}});  
        }
        if(err === OK){
            getResourceTask.amount -= targetAmount;
        }
    }
}


function putResource(creep, tasks, labs, terminal){
    const FullResourcesLabs = labs.filter(lab => lab.store[lab.mineralType] > 0);
    if(creep.store.getFreeCapacity() > 0 && FullResourcesLabs.length > 0){
        var closestTarget = FullResourcesLabs[0];
        if(closestTarget){
            if(creep.withdraw(closestTarget, closestTarget.mineralType) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}}); 
            }
        }
    } else {
        // 转移所有资源
        for(const resourceType in creep.store) {
            if(creep.transfer(terminal, resourceType) === ERR_NOT_IN_RANGE) {
                creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
            }
        }
        if(FullResourcesLabs.length === 0 && creep.store.getUsedCapacity() === 0){
            Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'transfer');
        }
    }
}

function fillTowers(creep, tasks, towers, storage) { 
    //Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'fillTower');
    //获取能量 
    if (creep.store[RESOURCE_ENERGY] === 0) {  
        const terminal = creep.room.terminal
        if(storage.store.energy > 0){
            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});  
            }  
        } else {
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
            }  
        }
    } else {
        // 查找 'fillTower' 类型的任务  
        const fillTowerTask = tasks.find(task => task.type === 'fillTower');  
        if (fillTowerTask) {  
            // Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'fillTower');
            // 查找对应的 tower  
            const targetTower = creep.room[fillTowerTask.id];  
            const lowEnergyTowers = towers.filter(tower=> tower.store.energy < tower.store.getCapacity(RESOURCE_ENERGY) * 0.8);
            if (targetTower.store.energy < 600) {  
                if (creep.transfer(targetTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(targetTower, {visualizePathStyle: {stroke: '#ffffff'}});  
                }  
            } else if (lowEnergyTowers.length > 0) {
                const closestTower = findClosestTarget(creep, lowEnergyTowers);  
                if (creep.transfer(closestTower, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(closestTower, {visualizePathStyle: {stroke: '#ffffff'}});  
                } 
            } else {
                creep.say('我滴任务完成啦');
                Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'fillTower');
            }
        }  
    }
}  

function fillLabsBoostSource(creep, tasks,terminal) {  
    const fillLabsTask = tasks.find(task => task.type === 'boostGetResource');  
    //Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'boostGetResource');
    const targetResource = fillLabsTask.resource[0].type;
    const targetAmount = Math.min(fillLabsTask.resource[0].amount, creep.store.getCapacity(targetResource));
    if(fillLabsTask.resource[0].amount <= 0){
        Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'boostGetResource');
    } else if(fillLabsTask.resource[0].amount > 0 && creep.store[targetResource] === 0){
        if(creep.withdraw(terminal, targetResource, targetAmount) === ERR_NOT_IN_RANGE){
            creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffffff' } }); 
        };
    } 
    if(creep.store[targetResource] > 0){
        const targetLab = creep.room[fillLabsTask.resource[0].id];  
        let err = creep.transfer(targetLab, targetResource);
        if( err === ERR_NOT_IN_RANGE ){
            creep.moveTo(targetLab, {visualizePathStyle: {stroke: '#ffffff'}});  
        }
        if(err === OK){
            fillLabsTask.resource[0].amount -= targetAmount;
        }
    }
}

function fillLabsEnergy(creep, tasks, labs, storage) {  
    //获取能量 
    if (creep.store[RESOURCE_ENERGY] === 0) {  
        if (storage.store.energy > 50000) {  
            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});  
            }  
        }  else {
            const terminal = creep.room.terminal;
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
        } 
    } else {
        const notFullEnergyLabs = labs.filter(lab => lab.store[RESOURCE_ENERGY] < 2000); 
        if (notFullEnergyLabs.length > 0){
            var closestTarget = findClosestTarget(creep, notFullEnergyLabs);
            if (creep.transfer(closestTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}})
            }
        } else {
            creep.say('我滴任务完成啦');
            Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'labGetEnergy');
        }
    }
}

function fillExtensions(creep, tasks,extensions, spawns, storage) {
    
    //获取能量 
    if (creep.store[RESOURCE_ENERGY] === 0) {  
        const terminal = creep.room.terminal
        if(storage.store.energy > 0){
            if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});  
            }  
        } else {
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
            }  
        }
    } else {
        const notFullEnergyExtensions = extensions.filter(extension => extension.store.energy < extension.store.getCapacity(RESOURCE_ENERGY));  
        const notFullEnergySpawns = spawns.filter(spawn => spawn.store.energy < spawn.store.getCapacity(RESOURCE_ENERGY));  
        let targets = [...notFullEnergyExtensions, ...notFullEnergySpawns];  
        var closestTarget = findClosestTarget(creep, targets);
        if (targets.length > 0 ){
            if (creep.transfer(closestTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}})
            }
        } else {
            creep.say('我滴任务完成啦');
            Memory.rooms[creep.room.name].tasks = tasks.filter(task => task.type !== 'fillExtension');
        }
    }
}  

function generateUUID() {
    var d = new Date().getTime();  // 获取当前时间戳
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;  // 生成随机数
        d = Math.floor(d / 16);  // 通过除以16更新d的值
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);  // 根据规则替换x和y
    });
    return uuid;
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

export default roleManager;