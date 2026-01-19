var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        // if (creep.memory.boosted === undefined) {  
        //     creep.memory.boosted = false;  
        // }  
        //const sourceRoomName = creep.memory.sourceRoomName;   
        const storage = creep.room.storage;  
        const tasksList = Memory.rooms[creep.room.name].tasks;
        const targetLink = creep.room[Memory.rooms[creep.room.name].upgradeLinkId]; 
        this.toggleState(creep);  
        if (creep.memory.building) { 
            creep.memory.dontPullMe = true; 
            //-------------------------------------------------------------------------------------------------------
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位 
            const closestSites = findClosestTarget(creep, constructionSites);
            // 筛选在 upgradeLink 附近三格内且 hits 低于 100M 的 rampart
            // 检查是否存在 targetRampartId 并且在房间内有效
            // const ramparts = creep.room.rampart;
            // let targetRampart = null;
            // const Max = 300000000;
            // 如果 targetRampart 不存在或无效，则重新搜索
            if(constructionSites.length > 0){
                this.buildConstruction_Sites(creep, closestSites);  
            } 
            // else {
            //     if (!targetRampart) {
            //         if ( targetLink ) {
            //             const upgradeLinkPos = targetLink.pos;
            //             // 筛选在 upgradeLink 附近三格内且 hits 低于 100M 的 rampart
            //             const nearbyLowHitsRamparts = ramparts.filter(rampart => {
            //                 const distance = rampart.pos.getRangeTo(upgradeLinkPos);
            //                 return distance <= 5 && rampart.hits < Max;
            //             });
            //             if (nearbyLowHitsRamparts.length > 0) {
            //                 targetRampart = findLowestHealthTarget(creep, nearbyLowHitsRamparts);
            //                 creep.memory.targetRampartId = targetRampart.id;
            //             }
            //         }
            //     }
            //     if (creep.memory.targetRampartId) {
            //         const targetRampartId = creep.memory.targetRampartId;
            //         targetRampart = creep.room[targetRampartId];
            //         // 检查 rampart 是否仍然有效（hits 低于 100M）
            //         if (targetRampart  && targetRampart.hits < Max) {
            //             // 继续使用当前 targetRampart
            //             this.buildRampart(creep, targetRampart,targetLink);
            //         } else {
            //             // 删除无效的 targetRampartId
            //             delete creep.memory.targetRampartId;
            //         }
            //     }
            // }
            //-------------------------------------------------------------------------------------------------------
        } else {  
            creep.memory.dontPullMe = false; 
            this.withdrawEnergy(creep,storage, targetLink);  
        }
        //---------------------------------------------强化逻辑-------------------------------------------------------------
	},
    

    buildRampart: function(creep, closestRamparts,targetLink) { 
        creep.withdraw(targetLink, RESOURCE_ENERGY)
        if (creep.repair(closestRamparts) == ERR_NOT_IN_RANGE) {  // 如果不在修复范围内  
            creep.moveTo(closestRamparts, {visualizePathStyle: {stroke: '#ffffff'}});  // 绘制路径并前往Rampart  
        }  
    },  

    buildConstruction_Sites: function(creep, targets) {  
        if(creep.build(targets) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}}); // 绘制路径
        }
        if (creep.build(targets) == OK ){
            creep.room.update();
        }
    },  

    boostBodyParts: function(creep, labs, tasksList) {  
        const workParts = creep.body.filter(part => part.type === WORK).length;  
        const totalCompound = workParts * 30;  
        const lab = labs[6];  
        const Compound = RESOURCE_CATALYZED_LEMERGIUM_ACID; 
        // 检查实验室是否有足够的RESOURCE_LEMERGIUM_HYDRIDE
        if (lab.store[Compound] < totalCompound) {  
            console.log(`实验室 ${lab.id} 缺少 ${totalCompound - lab.store[Compound]} 单位的 ${Compound}，无法强化Creep的WORK部件。`);  
            tasksList.push({  
                type:'boostGetResource',  
                resource: [  
                    {  
                        id: lab.id,  
                        type: Compound,  
                        amount: totalCompound - lab.store[Compound]  
                    }  
                ]  
            });  
        }  
        // 检查实验室是否有足够的ENERGY  
        if (lab.store[RESOURCE_ENERGY] < 2000) {  
            console.log(`实验室 ${lab.id} 缺少ENERGY，无法强化Creep的WORK部件。`);  
            tasksList.push({
                type: 'labGetEnergy'
            });  
        }   
        return;  
    },

    toggleState: function(creep) {  
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) { // building && 背包为空
            creep.memory.building = false;  // 变为 非building状态
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) { // 非building状态 && 背包满(空余为0)
	        creep.memory.building = true;  // 变为 building状态
	    }
    },  

    withdrawEnergy: function(creep,storage, targetLink) {  
        const terminal = creep.room.terminal;
        if( targetLink ){
            if (creep.withdraw(targetLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(targetLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
        } else {
            if( storage.store[RESOURCE_ENERGY] > 0 ) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
                }  
            } else if( terminal.store[RESOURCE_ENERGY] > 0 ){
                if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
                }  
            } else {
                const sources = creep.room.source;
                const source = sources[creep.memory.workLoc];
                if (creep.harvest(source) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });  
                }  
            }
        }
    } 
    
};

/**  
 * 为 creep 查找并设置下一个目标 Rampart（生命值低于 30M 的第一个 Rampart）  
 * @param {Creep} creep - 当前操作的 creep 对象  
 * @param {string[]} rampartList - 包含 rampart IDs 的数组  
 */  
function findAndSetNextTargetRampart(creep, rampartList) {  
    // 检查 memory 中是否已有目标 Rampart ID  
    if (!creep.memory.targetRampartId || isTargetRampartReady(creep)) {  
        // 遍历 rampartList 寻找下一个目标 Rampart  
        for (const rampartId of rampartList) {  
            const rampart = creep.room[rampartId]; 
            if (rampart && rampart.hits < creep.memory.li) {  
                // 找到符合条件的 Rampart，保存到 memory 中  
                creep.memory.targetRampartId = rampartId;  
                //console.log(`Creep ${creep.name} set new target Rampart ID: ${rampartId}`);  
                return;  
            }  
        }  
        // 如果没有找到符合条件的 Rampart，清空 targetRampartId  
        delete creep.memory.targetRampartId;  
        //console.log(`Creep ${creep.name} could not find a suitable target Rampart.`);  
    } else {  
        //console.log(`Creep ${creep.name} is already working on target Rampart ID: ${creep.memory.targetRampartId}`);  
    }  
}  
/**  
 * 检查当前目标 Rampart 是否已经准备好（生命值达到或超过 30M）  
 * @param {Creep} creep - 当前操作的 creep 对象  
 * @returns {boolean} - 如果目标 Rampart 已经准备好，则返回 true；否则返回 false  
 */  
function isTargetRampartReady(creep) {  
    const targetRampartId = creep.memory.targetRampartId;  
    if (!targetRampartId) {  
        return false;  
    }  
    const targetRampart = creep.room[targetRampartId];  
    return targetRampart && targetRampart.hits >= creep.memory.li;  
}  

function findRecentlyAttackedRamparts(room) {
    // 获取最近的事件日志
    const eventLog = room.getEventLog();
    // 用于存储受到攻击的rampart ID
    let attackedRamparts = [];
    // 遍历事件日志
    for (const event of eventLog) {
        // 检查事件类型是否为ATTACK
        if ((event.event === EVENT_ATTACK ) && event.data && event.data.target) {
            // 检查目标是否是rampart
            if (event.data.target.type === 'rampart') {
                // 添加受到攻击的rampart ID到数组中
                attackedRamparts.push(event.data.target.id);
            }
        }
    }

    // 返回受到攻击的rampart ID数组
    return attackedRamparts;
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
function findLowestHealthTarget(creep, targets) {  
    if (targets.length === 0) return null; // 如果没有目标，直接返回 null
    let lowestHealthTarget = targets[0];  
    let lowestHealth = targets[0].hits;  
    for (let i = 1; i < targets.length; i++) {  
        if (targets[i].hits < lowestHealth) {  
            lowestHealthTarget = targets[i];  
            lowestHealth = targets[i].hits;  
        }  
    }  
    return lowestHealthTarget;  
}

export default roleBuilder;