var roleUpgrader = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        //const sourceRoomName = creep.memory.sourceRoomName;   
        const tasksList = Memory.rooms[creep.room.name].tasks;
        creep.memory.dontPullMe = false;  
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        // if (creep.room.name !== sourceRoomName) {  
        //     creep.moveTo(new RoomPosition(20, 25, sourceRoomName), { visualizePathStyle: { stroke: '#0000ff' } });  
        // } 
        if (false) {  
            // 只在E54N19房间进行boost强化  
            if (!creep.memory.boosted) { 
                const labs = creep.room.lab; 
                var targetLab = labs[2]; 
                const result = targetLab.boostCreep(creep);  
                if (result === OK) { 
                    creep.memory.boosted = true;
                } else if (result === ERR_NOT_IN_RANGE) {  
                    creep.moveTo(targetLab, { visualizePathStyle: { stroke: '#0000ff' } });  
                } else if (result === ERR_NOT_ENOUGH_RESOURCES && !tasksList.some(task => task.type === 'boostGetResource') && !tasksList.some(task => task.type === 'labGetEnergy')) {  
                    // 如果资源不足，调用this.boostBodyParts来请求物资  
                    this.boostBodyParts(creep, labs, tasksList);  
                    // 注意：这里可能需要一些额外的逻辑来确保资源被获取后creep会回到boost的流程  
                }  
            }  
            // 如果已经boosted或者boost流程结束后  
            if (creep.memory.boosted) {  
                // 状态切换逻辑  
                this.toggleState(creep);  
                // 执行动作  
                if (creep.memory.upgrading) { 
                    creep.memory.dontPullMe = true;   
                    this.upgradeController(creep);  
                } else {  
                    this.harvestEnergy(creep, sourceRoomName,  upgradeLink, storage);  
                }  
            }  
        } else {  
            this.toggleState(creep);  
            // 执行动作  
            if (creep.memory.upgrading) {  
                creep.memory.dontPullMe = true;  
                this.upgradeController(creep);  
            } else {  
                const upgradeLink = creep.room[Memory.rooms[creep.room.name].upgradeLinkId];  
                const storage = creep.room.storage;  
                this.harvestEnergy(creep, upgradeLink, storage);  
            } 
        }
    },  
    toggleState: function(creep) {  
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {  
            creep.memory.upgrading = false;  
        }  
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {  
            creep.memory.upgrading = true;  
        }  
    },  

    boostBodyParts: function(creep, labs, tasksList) {  
        const workParts = creep.body.filter(part => part.type === WORK).length;  
        const totalCompound = workParts * 30;  
        const lab = labs[2];  
        const Compound = RESOURCE_GHODIUM_HYDRIDE; 
        // 检查实验室是否有足够的RESOURCE
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

    upgradeController: function(creep) {  
        creep.memory.dontPullMe = true;  
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {  
            creep.moveTo(creep.room.controller, { visualizePathStyle: { stroke: '#ffffff' } });  
        } 
    },  

    harvestEnergy: function(creep,  upgradeLink, storage) {  
        const terminal = creep.room.terminal
        if(!upgradeLink ){
            if (creep.withdraw(terminal, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(terminal, { visualizePathStyle: { stroke: '#ffaa00' } });  
            } 
        } else {
            if (creep.withdraw(upgradeLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {  
                creep.moveTo(upgradeLink, { visualizePathStyle: { stroke: '#ffaa00' } });  
            }  
        }
    }  
};  
export default roleUpgrader;