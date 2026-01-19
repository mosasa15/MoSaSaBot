var roleCentraltransferer = {  
    /**  
     * 中央转运者主要运行逻辑  
     * @param {Creep} creep - 需要运行逻辑的 Creep  
     */  
    run: function(creep) {  
        const roomMemory = Memory.rooms[creep.room.name];  
        const targetPosition = this.getTargetPosition(creep.room.name);  

        // 防止被拉动  
        creep.memory.dontPullMe = true;  

        // 移动到目标位置  
        if (!creep.pos.isEqualTo(targetPosition)) {  
            creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ffaa00', opacity: 0.5, lineStyle: 'dashed' } });  
        } else {  
            // 到达目标位置后执行能量管理逻辑  
            this.manageEnergy(creep, roomMemory);  
        }  
    },  

    /**  
     * 根据房间名称获取中央转运者的目标位置  
     * @param {string} roomName 房间名称  
     * @returns {RoomPosition} 目标位置  
     */  
    getTargetPosition: function(roomName) {  
        const positions = {  
            'E54N19': new RoomPosition(5, 9, roomName),  
            'E56N13': new RoomPosition(43, 16, roomName),  
            'E53N19': new RoomPosition(11, 38, roomName),  
            'E55N21': new RoomPosition(6, 20, roomName),  
            'E56N17': new RoomPosition(35, 21, roomName),  
            'E55N9': new RoomPosition(31, 4, roomName),  
            'E58N14': new RoomPosition(26, 29, roomName), 
            'E53N1': new RoomPosition(42, 28, roomName)
        };  
        return positions[roomName] || null;  
    },  

    /**  
     * 管理房间内 Terminal 和 Storage 的能量平衡  
     * @param {Creep} creep - 当前操作的 Creep  
     * @param {Object} roomMemory - 房间内存对象，包含房间状态信息  
     */  
    manageEnergy: function(creep, roomMemory) {  
        const terminal = creep.room.terminal;  
        const storage = creep.room.storage;  
        const centerLink = creep.room[roomMemory.centerLinkId];  
        const tasksList = roomMemory.tasks;  

        this.ensureRelevantResources(creep, storage, tasksList);

        if (tasksList.some(task => task.type === 'share')) { 
            this.handleShareTask(creep, tasksList, storage,terminal);  
        }
        else 
        if (tasksList.some(task => task.type === 'S-T')) {  
            this.handleSTask(creep, tasksList);  
        } else 
        if (tasksList.some(task => task.type === 'transferToUpgradeLink')) {  
            this.handleUpgradeLinkTask(creep, tasksList, storage, centerLink);  
        } 
        else 
        if (tasksList.some(task => task.type === 'transferToStorage')) { 
            this.handleStorageTask(creep, tasksList, storage, centerLink);  
        } 
    },  

    /**  
     * 确保手上只有相关任务需要的资源  
     * @param {Creep} creep - 当前操作的 Creep  
     * @param {StructureStorage} storage - 储存器  
     * @param {Array} tasksList - 任务列表  
     */  
    ensureRelevantResources: function(creep, storage, tasksList) {  
        const currentTask = tasksList.find(task =>  
            ['S-T', 'share'].includes(task.type));  
        if (!currentTask) return;  
        //console.log(currentTask.type + creep.room.name)

        const allowedResource = currentTask.type === 'S-T' || currentTask.type === 'share'  
            ? currentTask.details.resourceType  
            : RESOURCE_ENERGY;  

        for (const resourceType in creep.store) {  
            if (resourceType !== allowedResource) {  
                if (storage && creep.transfer(storage, resourceType)) {  

                }  
                return;  
            }  
        }  
    }, 

    /**
     * 
     * @param {*} creep 
     * @param {*} tasks 
     * @param {*} storage 
     * @param {*} terminal 
     */
    handleShareTask: function(creep, tasks, storage, terminal) {  
        const task = tasks.find(task => task.type === 'share');  

        if (task && storage && terminal) {  
            const { resourceType, number, cost, room } = task.details;  
            const Id = task.Id;
            // 转移资源到终端
            if (terminal.store[resourceType] < number) {  
                const remaining = number - (terminal.store[resourceType] || 0);  
                const transferAmount = Math.min(remaining, creep.store.getCapacity(resourceType), storage.store[resourceType]);  

                if (creep.store[resourceType] === 0) {  
                    creep.withdraw(storage, resourceType, transferAmount);
                } else {  
                    creep.transfer(terminal, resourceType);
                }  
            }  
            // 转移运费到终端
            else if (terminal.store[RESOURCE_ENERGY] < cost) {  
                const remainingEnergy = cost - (terminal.store[RESOURCE_ENERGY] || 0);  
                const transferAmount = Math.min(remainingEnergy, creep.store.getCapacity(RESOURCE_ENERGY), storage.store[RESOURCE_ENERGY]);  

                if (creep.store[RESOURCE_ENERGY] === 0) {  
                    creep.withdraw(storage, RESOURCE_ENERGY, transferAmount);
                } else {  
                    creep.transfer(terminal, RESOURCE_ENERGY);
                }  
            }  else if(resourceType === 'energy' && terminal.store[resourceType] < number + cost){
                    const transferAmount = Math.min(cost, creep.store.getCapacity(resourceType), storage.store[resourceType]);   
                    if (creep.store[resourceType] === 0) {  
                        creep.withdraw(storage, resourceType, transferAmount);
                    } else {  
                        creep.transfer(terminal, resourceType);
                    }  
            }
            // 完成任务
            else if( terminal.send(resourceType, number, room, '是的，这是一份礼物 ') === OK ){  
                console.log(`[资源共享] 任务完成，房间 ${creep.room.name} 已将 ${number} ${resourceType} 和 ${cost} 运费转移至 Terminal`);  
                this.completeTaskById(creep, tasks, Id);  
            }  
            if(terminal.store[resourceType] + storage.store[resourceType] < number ){
                this.completeTaskById(creep, tasks, Id); 
            }
        }  
    },  

    /**  
     * 处理升级链接任务  
     */  
    handleUpgradeLinkTask: function(creep, tasks, storage, centerLink) {  
        if (centerLink) {  
            if (centerLink.store[RESOURCE_ENERGY] < 799) {  
                this.transferBetweenStructures(creep, storage, centerLink, RESOURCE_ENERGY);  
            } 
            else {  
                this.completeTaskBytype(creep, tasks, 'transferToUpgradeLink');  
            }  
        }  
    },  

    /**  
     * 处理储存器任务  
     */  
    handleStorageTask: function(creep, tasks, storage, centerLink) {  
        if (centerLink) {  
            if (centerLink.store[RESOURCE_ENERGY] > 0 || creep.store[RESOURCE_ENERGY] > 0) {  
                this.transferBetweenStructures(creep, centerLink, storage, RESOURCE_ENERGY);  
            } 
            else {  
                this.completeTaskBytype(creep, tasks, 'transferToStorage');  
            }  
        }  
    },  

    /**  
     * 处理 S-T 类型任务  
     * @param {Creep} creep - 当前操作的 Creep  
     * @param {Array} tasks - 任务列表  
     */  
    handleSTask: function(creep, tasks) {   
        const task = tasks.find(task => task.type === 'S-T');  
        if (task) {  
            //console.log(creep.name)
            const { from, to, resourceType, amount } = task.details; 
            const source = creep.room[from];  
            const target = creep.room[to];  
            const Id = task.Id
            const targetAmount = Math.min(amount, creep.store.getCapacity(resourceType));
            //console.log(targetAmount)
            if (source && target) {  
                if (creep.store[resourceType] === 0 ) {  
                    creep.withdraw(source, resourceType, targetAmount)
                } else {  
                    let err = creep.transfer(target, resourceType, targetAmount);
                    if(err === OK){
                        task.details.amount -= targetAmount;
                        if (task.details.amount <= 0) {  
                            // 任务完成后，根据 ID 删除任务
                            this.completeTaskById(creep, tasks, Id);  
                        }
                    }
                }  
            } else {  
                // 如果没有找到 source 或 target，移除任务  
                this.completeTaskById(creep, tasks, Id);  // 无效的任务也通过 ID 删除
            }  
            if (source.store[resourceType] === 0) {  
                // 任务完成后，根据 ID 删除任务
                this.completeTaskById(creep, tasks, Id);  
            }
        }  
    },  
    /**  
     * 通用的能量转移逻辑  
     * @param {Creep} creep - 当前操作的 Creep  
     * @param {Structure} source - 能量来源建筑  
     * @param {Structure} target - 能量目标建筑  
     * @param {string} resourceType - 资源类型  
     */  
    transferBetweenStructures: function(creep, source, target, resourceType) { 
        if (creep.store[resourceType] === 0) {  
            creep.withdraw(source, resourceType); 
        } else {  
            creep.transfer(target, resourceType); 
        }  
    },  

    /**  
     * 完成任务并更新内存  
     * @param {Creep} creep - 当前操作的 Creep  
     * @param {Array} tasks - 任务列表  
     * @param {string} taskType - 要完成的任务类型  
     */  
    completeTaskBytype: function(creep, tasks, taskType) {  

        const task = tasks.find(task => (task.type === taskType) );
        if (task) {
            const index = tasks.indexOf(task);
            Memory.rooms[creep.room.name].tasks.splice(index, 1);
        } 
    },
    /**  
     * 根据任务 ID 完成任务并更新内存  
     * @param {Creep} creep - 当前操作的 Creep  
     * @param {Array} tasks - 任务列表  
     * @param {string} taskId - 要完成的任务的 ID  
     */  
    completeTaskById: function(creep, tasks, taskId) {  
        const taskIndex = tasks.findIndex(task => task.Id === taskId);  // 根据任务 ID 查找任务的索引
        if (taskIndex !== -1) {  
            tasks.splice(taskIndex, 1);  // 从任务列表中删除该任务
        }
    }
};  


export default roleCentraltransferer;  
