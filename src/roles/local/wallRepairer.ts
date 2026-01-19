/**
 * 刷墙爬虫角色
 */
const roleWallRepairer = {
    /** @param {Creep} creep **/
    run: function(creep) {
        // if (creep.memory.boosted === undefined) {  
        //     creep.memory.boosted = false;  
        // }  
        //const sourceRoomName = creep.memory.sourceRoomName;   
        const storage = creep.room.storage;  
        //const tasksList = Memory.rooms[creep.room.name].tasks;
        const targetLink = creep.room[Memory.rooms[creep.room.name].upgradeLinkId]; 
        this.toggleState(creep);  
        if (creep.memory.building) { 
            creep.memory.dontPullMe = true; 
            //-------------------------------------------------------------------------------------------------------
            //const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES); // 寻找建筑位 
            //const closestSites = findClosestTarget(creep, constructionSites);
            // 筛选在 upgradeLink 附近三格内且 hits 低于 100M 的 rampart
            // 检查是否存在 targetRampartId 并且在房间内有效
            const ramparts = creep.room.rampart;
            let targetRampart = null;
            const Max = 300000000;
            if (!targetRampart) {
                if ( targetLink ) {
                    const upgradeLinkPos = targetLink.pos;
                    // 筛选在 upgradeLink 附近三格内且 hits 低于 100M 的 rampart
                    const nearbyLowHitsRamparts = ramparts.filter(rampart => {
                        const distance = rampart.pos.getRangeTo(upgradeLinkPos);
                        return distance <= 3 && rampart.hits < Max;
                    });
                    if (nearbyLowHitsRamparts.length > 0) {
                        targetRampart = findLowestHealthTarget(creep, nearbyLowHitsRamparts);
                        creep.memory.targetRampartId = targetRampart.id;
                    }
                }
            }
            if (creep.memory.targetRampartId) {
                const targetRampartId = creep.memory.targetRampartId;
                targetRampart = creep.room[targetRampartId];
                // 检查 rampart 是否仍然有效（hits 低于 100M）
                if (targetRampart  && targetRampart.hits < Max) {
                    // 继续使用当前 targetRampart
                    this.buildRampart(creep, targetRampart,targetLink);
                } else {
                    // 删除无效的 targetRampartId
                    delete creep.memory.targetRampartId;
                }
            }
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
        if( targetLink ){
            if (creep.withdraw(targetLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(targetLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
        } else {
            if( storage.store[RESOURCE_ENERGY] > 0 ) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffaa00' } });  
                }  
            } 
        }
    } 
    
};
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

export default roleWallRepairer; 
