var Link = {  
    /**  
     * 根据Link的职责执行相应的操作  
     * @param {StructureLink} link - 当前操作的Link对象  
     */  
    run: function( roomName ) {  
        // 获取当前房间的内存 
        const roomMemory = Memory.rooms[roomName];  
        const tasksList = Memory.rooms[roomName].tasks;  
        // 检查Link的职责  
        let room = Game.rooms[roomName];
        const links = room.link;
        if( roomName === 'E55N9'){
            if( links[3] ){
                Memory.rooms.E55N9.upgradeLinkId = links[3].id;
            }
        }
        if( roomName === 'E56N13'){
            // console.log(links)
            if( links[2] ){
                Memory.rooms.E56N13.upgradeLinkId = links[2].id;
            }
        }
        if( roomName === 'E53N1'){
            // console.log(links)
            if( links[2] ){
                Memory.rooms.E53N1.centerLinkId = links[2].id;
                Memory.rooms.E53N1.upgradeLinkId = '123';
            }
        }
        if( roomName === 'E58N14'){
            // console.log(links)
            if( links[3] ){
                Memory.rooms.E58N14.upgradeLinkId = links[3].id;
            }
        }
        if( roomName === 'E56N17'){
            if( links[3] ){
                Memory.rooms.E56N17.upgradeLinkId = links[3].id;
            }
        }
        if( roomName === 'E53N19'){
            if( links[3] ){
                Memory.rooms.E53N19.upgradeLinkId = links[3].id;
                Memory.rooms.E53N19.centerLinkId = links[2].id;
            }
            if( links[2] ){
                Memory.rooms.E53N19.centerLinkId = links[2].id;
            }
        }
        if( roomName === 'E54N19'){
            if( links[4] ){
                Memory.rooms.E54N19.upgradeLinkId = links[4].id;
            }
        }
        if( roomName === 'E55N21'){
            if( links[3] ){
                Memory.rooms.E55N21.upgradeLinkId = links[3].id;
            }
        }
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
        const upgradeLink = link.room[roomMemory.upgradeLinkId];  
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
        const centerLink = link.room[roomMemory.centerLinkId];  
        const upgradeLink = link.room[roomMemory.upgradeLinkId];  
        if (upgradeLink) {  
            // 检查UpgradeLink是否存在  
            if (upgradeLink.store[RESOURCE_ENERGY] <= 600 ) {  
                // 如果存在UpgradeLink且其能量未满，则向UpgradeLink传输能量  
                if (link.transferEnergy(upgradeLink) === OK) {  
                    //console.log('UpgradeLink能量不足，向upgradeLink发送能量成功。传输冷却时间：', link.cooldown);  
                } 
            } else if (centerLink) {  
                // 否则，如果CenterLink存在，则向CenterLink传输能量  
                if (link.transferEnergy(centerLink) === OK) {  
                    //console.log('UpgradeLink能量已满，向centerLink发送能量成功。传输冷却时间：', link.cooldown);  
                } 
            }  
        } else if (centerLink) {  
            // 否则，如果CenterLink存在，则向CenterLink传输能量  
            if (link.transferEnergy(centerLink) === OK) {  
                //console.log('UpgradeLink能量已满，向centerLink发送能量成功。传输冷却时间：', link.cooldown);  
            } 
        } 
    }
};  

// 导出模块  
export default Link;