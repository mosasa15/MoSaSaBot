var Link = {  
    /**  
     * 根据Link的职责执行相应的操作  
     * @param {StructureLink} link - 当前操作的Link对象  
     */  
    run: function( roomName ) {  
        // 获取当前房间的内存 
        if (!Memory.rooms[roomName]) {
            Memory.rooms[roomName] = {};
        }
        const roomMemory = Memory.rooms[roomName];  
        
        if (!roomMemory.tasks) {
            roomMemory.tasks = [];
        }
        const tasksList = roomMemory.tasks;  
        
        // 检查Link的职责  
        let room = Game.rooms[roomName];
        if (!room) return;
        
        const links = room.link;
        if (!links || links.length === 0) return;

        // Generic Logic for Auto-Link Configuration could be added here.
        // For now, we rely on roomMemory.centerLinkId and upgradeLinkId being set manually or by other logic.
        // If they are not set, links default to SourceLink behavior.

        for(let link of links){
            if (roomMemory.centerLinkId === link.id) {  
                // 作为CenterLink的行为  
                this.runAsCenterLink(link, roomMemory, tasksList);  
            } else if (roomMemory.upgradeLinkId === link.id) {  
                // 作为UpgradeLink的行为  
                this.runAsUpgradeLink(link, roomMemory, tasksList);  
            } else {  
                // 默认作为SourceLink的行为  
                this.runAsSourceLink(link, roomMemory, tasksList);  
            }  
        }
    },  

    /**    
     * CenterLink的行为    
     * @param {StructureLink} link  当前作为中心Link的结构体    
     * @param {Object} roomMemory  房间内存对象，包含关于房间状态的信息    
     */    
    runAsCenterLink: function(link, roomMemory, tasks) {    
        if (!roomMemory.upgradeLinkId) return;
        const upgradeLink = Game.getObjectById(roomMemory.upgradeLinkId); // Use Game.getObjectById
        if (!upgradeLink) return;

        if(tasks.some(task => task.type === 'transferToUpgradeLink')){
            if(link.store[RESOURCE_ENERGY] > 700){
                const result = link.transferEnergy(upgradeLink);
                if( result === OK){
                    Memory.rooms[link.room.name].tasks = tasks.filter(task => task.type !== 'transferToUpgradeLink');
                }
            }
        } else if( link.store[RESOURCE_ENERGY] > 700 && !tasks.some(task => task.type === 'transferToStorage') ){
            Memory.rooms[link.room.name].tasks.push({
                type: 'transferToStorage'
            });
        }
    },

    /**  
     * UpgradeLink的行为  
     * @param {StructureLink} link  
     * @param {Object} roomMemory  
     */  
    runAsUpgradeLink: function(link, roomMemory, tasks) {  
        if (link.store[RESOURCE_ENERGY] >= 600) {  
            if(tasks.some(task => task.type === 'transferToUpgradeLink')){
                Memory.rooms[link.room.name].tasks = tasks.filter(task => task.type !== 'transferToUpgradeLink');
            }
        } else if (link.store[RESOURCE_ENERGY] < 100 && !tasks.some(task => task.type === 'transferToUpgradeLink')) {  
            Memory.rooms[link.room.name].tasks.push({
                type: 'transferToUpgradeLink'
            }); 
        }  
    },  

    /**  
     * SourceLink的行为  
     * @param {StructureLink} link - 当前的SourceLink实例  
     * @param {Object} roomMemory - 房间内存对象  
     */  
    runAsSourceLink: function(link, roomMemory, tasksList) {  
        const centerLink = roomMemory.centerLinkId ? Game.getObjectById(roomMemory.centerLinkId) : null;  
        const upgradeLink = roomMemory.upgradeLinkId ? Game.getObjectById(roomMemory.upgradeLinkId) : null;  
        
        if (link.cooldown > 0) return;
        if (link.store.getUsedCapacity(RESOURCE_ENERGY) < link.store.getCapacity(RESOURCE_ENERGY) * 0.5) return;

        if (upgradeLink) {  
            // 检查UpgradeLink是否存在  
            if (upgradeLink.store[RESOURCE_ENERGY] <= 600 ) {  
                // 如果存在UpgradeLink且其能量未满，则向UpgradeLink传输能量  
                link.transferEnergy(upgradeLink);
            } else if (centerLink) {  
                // 否则，如果CenterLink存在，则向CenterLink传输能量  
                link.transferEnergy(centerLink);
            }  
        } else if (centerLink) {  
            // 否则，如果CenterLink存在，则向CenterLink传输能量  
            link.transferEnergy(centerLink);
        } 
    }
};  

// 导出模块  
export default Link;
