var roleHarvester = {  
    /** @param {Creep} creep **/  
    run: function(creep) {  
        const startCpu = Game.cpu.getUsed();  // 记录开始时间
        try {
            creep.memory.dontPullMe = true;  
            //creep.say('🌾',true);
            const workLoc = creep.memory.workLoc;
            const room = creep.room;
            const { source } = room;
            let targetSource = source ? source[workLoc] : null;
            //let targetTransfer = link ? link[workLoc] : null;

            // 确定当前应该使用的运输目标
            let currentTarget = this.determineTarget(creep, targetSource);
            
            // 如果背包未满，继续采集
            if (creep.store.getFreeCapacity() > 0) {
                if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(targetSource, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                
                // // 检查是否需要建造container
                // if (room.controller.level < 4 && !storage && creep.pos.inRangeTo(targetSource,1)) {
                //     this.handleContainerConstruction(creep);
                // }
            } 
            // 如果背包满了，开始转移资源
            else {
                this.transferResources(creep, currentTarget);
            }
        } finally {
            const usedCpu = Game.cpu.getUsed() - startCpu;
            //console.log(`[CPU] ${creep.name} 消耗: ${usedCpu.toFixed(2)}`);
            // 计算最大值和平均值
            // 预警提示（当单次消耗超过3.5或平均超过2时）
            if (usedCpu > 3.5) {
                console.log(`⚠️ [CPU警告] ${creep.name} 单次CPU消耗过高：${usedCpu.toFixed(2)}`);
            }
        }
    },

    // 确定资源转移目标
    determineTarget: function(creep, targetSource) {
        const room = creep.room;
        const { link, storage } = room;
        const workLoc = creep.memory.workLoc;

        // 如果有对应的link且link可用，优先使用link
        if (link && link[workLoc]) {
            return link[workLoc];
        }
        
        // 如果有storage，使用storage
        if (storage) {
            return storage;
        }

        // 寻找或创建container
        let container = this.findSourceContainer(targetSource);
        if (container) {
            return container;
        }

        return null;
    },

    // // 处理container的建造
    // handleContainerConstruction: function(creep) {
    //     const constructionSite = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES)[0];
    //     if (!constructionSite) {
    //         // 检查当前位置是否已有container
    //         const containers = creep.pos.lookFor(LOOK_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER);
    //         if (containers.length === 0) {
    //             // 在当前位置创建container的建筑工地
    //             creep.pos.createConstructionSite(STRUCTURE_CONTAINER);
    //         }
    //     }
    // },

    // 寻找能量源附近的container
    findSourceContainer: function(source) {
        if (!source) return null;
        
        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: s => s.structureType === STRUCTURE_CONTAINER
        });
        
        return containers.length > 0 ? containers[0] : null;
    },

    // 转移资源到目标
    transferResources: function(creep, target) {
        if (!target) return;
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        }
    }
};  

export default roleHarvester;