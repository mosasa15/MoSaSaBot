var Link = {  
    run: function( roomName ) {  
        if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
        const roomMemory = Memory.rooms[roomName];  
        if (!roomMemory.tasks) roomMemory.tasks = [];
        const tasksList = roomMemory.tasks;  
        
        let room = Game.rooms[roomName];
        if (!room) return;
        
        const links = room.link || []; // Assumes room.link is cached by framework or something, otherwise room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_LINK}})
        if (links.length === 0) return;

        // Auto-configure Links if not set
        this.initLinks(room);

        for(let link of links){
            if (roomMemory.centerLinkId === link.id) {  
                this.runAsCenterLink(link, roomMemory, tasksList);  
            } else if (roomMemory.upgradeLinkId === link.id) {  
                this.runAsUpgradeLink(link, roomMemory, tasksList);  
            } else {  
                this.runAsSourceLink(link, roomMemory, tasksList);  
            }  
        }
    },  

    initLinks: function(room) {
        if (Game.time % 100 !== 0) return; // Don't run every tick
        
        const roomMemory = Memory.rooms[room.name];
        const links = room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_LINK }
        });
        
        if (links.length === 0) return;

        // 1. Identify Center Link (Closest to Storage)
        if (!roomMemory.centerLinkId && room.storage) {
            const centerLink = room.storage.pos.findClosestByRange(links);
            if (centerLink && room.storage.pos.getRangeTo(centerLink) <= 3) {
                roomMemory.centerLinkId = centerLink.id;
                console.log(`[AutoLink] Identified CenterLink ${centerLink.id} in ${room.name}`);
            }
        }

        // 2. Identify Upgrade Link (Closest to Controller)
        if (!roomMemory.upgradeLinkId && room.controller) {
            const upgradeLink = room.controller.pos.findClosestByRange(links);
            if (upgradeLink && room.controller.pos.getRangeTo(upgradeLink) <= 3) {
                roomMemory.upgradeLinkId = upgradeLink.id;
                console.log(`[AutoLink] Identified UpgradeLink ${upgradeLink.id} in ${room.name}`);
            }
        }
        
        // Others are implicitly SourceLinks
    },

    runAsCenterLink: function(link, roomMemory, tasks) {    
        if (!roomMemory.upgradeLinkId) return;
        const upgradeLink = Game.getObjectById(roomMemory.upgradeLinkId);
        if (!upgradeLink) return;

        // If tasks demand energy for upgrade link
        if(tasks.some(task => task.type === 'transferToUpgradeLink')){
            if(link.store[RESOURCE_ENERGY] > 700){
                const result = link.transferEnergy(upgradeLink);
                if( result === OK){
                    Memory.rooms[link.room.name].tasks = tasks.filter(task => task.type !== 'transferToUpgradeLink');
                }
            }
        } else if( link.store[RESOURCE_ENERGY] > 700 && !tasks.some(task => task.type === 'transferToStorage') ){
            // If full and no demand, request to empty into storage
            Memory.rooms[link.room.name].tasks.push({
                type: 'transferToStorage'
            });
        }
    },

    runAsUpgradeLink: function(link, roomMemory, tasks) {  
        if (link.store[RESOURCE_ENERGY] >= 600) {  
            if(tasks.some(task => task.type === 'transferToUpgradeLink')){
                Memory.rooms[link.room.name].tasks = tasks.filter(task => task.type !== 'transferToUpgradeLink');
            }
        } else if (link.store[RESOURCE_ENERGY] < 100 && !tasks.some(task => task.type === 'transferToUpgradeLink')) {  
            // Request energy
            Memory.rooms[link.room.name].tasks.push({
                type: 'transferToUpgradeLink'
            }); 
        }  
    },  

    runAsSourceLink: function(link, roomMemory, tasksList) {  
        const centerLink = roomMemory.centerLinkId ? Game.getObjectById(roomMemory.centerLinkId) as StructureLink | null : null;  
        const upgradeLink = roomMemory.upgradeLinkId ? Game.getObjectById(roomMemory.upgradeLinkId) as StructureLink | null : null;  
        
        if (link.cooldown > 0) return;
        if (link.store.getUsedCapacity(RESOURCE_ENERGY) < link.store.getCapacity(RESOURCE_ENERGY) * 0.5) return;

        // Prioritize Upgrade Link if it needs energy
        if (upgradeLink && upgradeLink.store[RESOURCE_ENERGY] <= 600) {
             link.transferEnergy(upgradeLink);
             return;
        }
        
        // Otherwise dump to Center Link
        if (centerLink) {  
            link.transferEnergy(centerLink);
        } 
    }
};  

export default Link;
