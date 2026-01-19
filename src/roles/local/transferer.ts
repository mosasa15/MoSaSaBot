var roleTransferer = {  

    /** @param {Creep} creep **/  
    run: function(creep) {  
        const containers = creep.room.container; 
        const mineral = creep.room.mineral;
        const terminal = creep.room.terminal;
        //-------------------------------------------------------------------------------------------------------------------------------
        // 如果正在转移且能量为0，则停止转移  
        if (creep.memory.transfering && creep.store[RESOURCE_ENERGY] === 0) {  
            creep.memory.transfering = false;  
            creep.say('😃下班了！好耶');  
        }  
        // 如果不在转移且容量已满，则开始转移  
        if (!creep.memory.transfering && creep.store.getFreeCapacity() === 0 ) {  
            creep.memory.transfering = true;  
            creep.say('😟上班了！呜呜呜');  
        }  
        
        // 如果不在转移  
        if (!creep.memory.transfering) {  
            // 根据creep的workLoc找到对应的容器  
            if (containers.length > 0) {  
                const targetContainer = containers[0];  
                for (let resourceType in targetContainer.store) {
                    if (creep.withdraw(targetContainer, resourceType) === ERR_NOT_IN_RANGE) {  
                        creep.moveTo(targetContainer, {visualizePathStyle: {stroke: '#ffffff'}});  
                    }  
                }
            }  
        } else {  
            if (terminal) { 
                for (let resourceType in creep.store) {
                    if(creep.transfer(terminal, resourceType) === ERR_NOT_IN_RANGE){
                        creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                    } 
                }
            }
        }  
    }  
};  

export default roleTransferer;
