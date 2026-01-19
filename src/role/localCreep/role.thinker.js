var rolethinker = {
    /** @param {Creep} creep **/
    //-------------------------------------------------------------------------------------
    run: function(creep) {
        // creep.memory.dontPullMe = true; 
        const labs = creep.room.lab;
        const storage = creep.room.storage;
        const terminal = creep.room.terminal;
        // console.log(labs)
        // // 定义目标资源，这里假设我们有四种不同的资源对应四个lab（A, B, C, D）    
        // const resourceTypes = ['XLHO2','XKHO2','XZHO2','XGHO2','XGH2O','XUH2O','XLH2O']; // 根据实际情况替换资源类型  
        // // 化合物所需的资源量（这里假设每个lab需要相同量的资源，但可以根据实际情况调整）  
        const requiredCompoundAmount = 3000; 

        if (creep.room.name === 'E55N9') {  
            //const resourceTypes = ['XLHO2','XKHO2','XZHO2','XGHO2','XZH2O','XUH2O','LH2O']; // 根据实际情况替换资源类型  
            const resourceTypes = ['ZO','UO','KH']; // 根据实际情况替换资源类型  
            const notFullEnergyLabs = labs.filter(lab => lab.store[RESOURCE_ENERGY] < 2000); 
            if ( notFullEnergyLabs.length > 0 ){
                if(creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && creep.store[RESOURCE_ENERGY] === 0 ){
                    // 转移所有资源
                    for(const resourceType in creep.store) {
                        if(creep.transfer(terminal, resourceType) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                        }
                    }
                }
                if(creep.store[RESOURCE_ENERGY] === 0) {
                    if(creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                } else {
                    var closestTarget = findClosestTarget(creep, notFullEnergyLabs);
                    if (creep.transfer(closestTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}})
                    }
                }
            } else {
                if(creep.store[RESOURCE_ENERGY] === 0) {
                    for (let i = 0; i < resourceTypes.length && labs[i]; i++) {    
                        const lab = labs[i];    
                        const targetResource = resourceTypes[i];    
                        // 检查lab是否存在  
                        if (lab) {  
                            // 检查lab是否正在处理我们关心的矿物，并且化合物是否不足  
                            if ( lab.store[targetResource] < requiredCompoundAmount) {  
                                // 如果creep没有携带目标资源，尝试从terminal中提取  
                                if (creep.store[targetResource] === 0) {  
                                    
                                    if (creep.withdraw(terminal, targetResource) === ERR_NOT_IN_RANGE) {  
                                        creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                                        // 提取后需要返回继续下面的逻辑，所以这里不break  
                                    }  
                                // 如果creep已经携带了目标资源，直接尝试传输到lab  
                                } else {  
                                    if (creep.transfer(lab, targetResource) === ERR_NOT_IN_RANGE) {  
                                        creep.moveTo(lab, {visualizePathStyle: {stroke: '#ffffff'}});  
                                    }  
                                }  
                                // // 假设我们只关心第一个匹配的并且化合物不足的lab  
                                // break;   
                            }  
                        }  
                    }  
                } else {
                    if(creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                }
            } 
        } else if((creep.room.name !== 'E55N9')){
            const resourceTypes = ['LH2O','XUH2O','XZHO2']; // 根据实际情况替换资源类型  
            const notFullEnergyLabs = labs.filter(lab => lab.store[RESOURCE_ENERGY] < 2000); 
            if ( notFullEnergyLabs.length > 0 ){
                if(creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && creep.store[RESOURCE_ENERGY] === 0 ){
                    // 转移所有资源
                    for(const resourceType in creep.store) {
                        if(creep.transfer(terminal, resourceType) === ERR_NOT_IN_RANGE) {
                            creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                        }
                    }
                }
                if(creep.store[RESOURCE_ENERGY] === 0) {
                    if(creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                } else {
                    var closestTarget = findClosestTarget(creep, notFullEnergyLabs);
                    if (creep.transfer(closestTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(closestTarget, {visualizePathStyle: {stroke: '#ffffff'}})
                    }
                }
            } else {
                if(creep.store[RESOURCE_ENERGY] === 0) {
                    // console.log(labs[1])
                    for (let i = 0; i < resourceTypes.length && labs[i]; i++) {    
                        const lab = labs[i];    
                        const targetResource = resourceTypes[i];    
                        // 检查lab是否存在  
                        if (lab) {  
                            // 检查lab是否正在处理我们关心的矿物，并且化合物是否不足  
                            if ( lab.store[targetResource] < requiredCompoundAmount) {  
                                // 如果creep没有携带目标资源，尝试从terminal中提取  
                                if (creep.store[targetResource] === 0) {  
                                    if (creep.withdraw(terminal, targetResource, 500) === ERR_NOT_IN_RANGE) {  
                                        creep.moveTo(terminal, {visualizePathStyle: {stroke: '#ffffff'}});  
                                        // 提取后需要返回继续下面的逻辑，所以这里不break  
                                    }  
                                // 如果creep已经携带了目标资源，直接尝试传输到lab  
                                } else {  
                                    if (creep.transfer(lab, targetResource) === ERR_NOT_IN_RANGE) {  
                                        creep.moveTo(lab, {visualizePathStyle: {stroke: '#ffffff'}});  
                                    }  
                                }  
                                // // 假设我们只关心第一个匹配的并且化合物不足的lab  
                                // break;   
                            }  
                        }  
                    }  
                } else {
                    if(creep.transfer(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                }
            } 
        } 
    }  
};  
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
export default rolethinker;
