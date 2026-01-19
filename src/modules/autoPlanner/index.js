import Planner from './planner';

const AutoPlanner = {
    run: function(room) {
        if (!room || !room.controller || !room.controller.my) return;
        
        // Initialize Memory
        if (!room.memory.layout) {
            // Attempt to plan
            console.log(`[AutoPlanner] Planning layout for ${room.name}...`);
            const result = Planner.computeLayout(room);
            if (result && result.structMap) {
                room.memory.layout = result.structMap;
                console.log(`[AutoPlanner] Layout planned successfully for ${room.name}`);
            } else {
                console.log(`[AutoPlanner] Layout planning failed for ${room.name}`);
                // Retry later?
                return;
            }
        }
        
        // Manage Construction Sites (every 100 ticks)
        if (Game.time % 100 === 0) {
            this.manageConstruction(room);
        }
        
        // Visualization (Optional, consume CPU)
        // if (Game.time % 10 === 0) this.visualize(room);
    },
    
    manageConstruction: function(room) {
        const layout = room.memory.layout;
        if (!layout) return;
        
        const rcl = room.controller.level;
        const maxSites = 5; // Don't spam too many sites at once
        let sitesPlaced = room.find(FIND_MY_CONSTRUCTION_SITES).length;
        
        if (sitesPlaced >= maxSites) return;
        
        // Priority Order
        const priority = [
            'spawn', 'extension', 'tower', 'storage', 'container', 
            'link', 'extractor', 'terminal', 'lab', 'factory',
            'nuker', 'powerSpawn', 'observer', 'rampart', 'road', 'constructedWall'
        ];
        
        for (const type of priority) {
            if (!layout[type]) continue;
            
            // Check how many we can build at this RCL
            const allowed = CONTROLLER_STRUCTURES[type][rcl];
            if (allowed <= 0) continue;
            
            // Count existing
            const existing = room.find(FIND_STRUCTURES, {
                filter: s => s.structureType === type
            }).length;
            
            // Count sites
            const sites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                filter: s => s.structureType === type
            }).length;
            
            if (existing + sites >= allowed) continue;
            
            // Try to place more
            for (const pos of layout[type]) {
                if (sitesPlaced >= maxSites) break;
                
                const x = pos[0];
                const y = pos[1];
                
                // Check if structure already exists
                const structuresAtPos = room.lookForAt(LOOK_STRUCTURES, x, y);
                if (structuresAtPos.some(s => s.structureType === type)) continue;
                
                // Check if site already exists
                const sitesAtPos = room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y);
                if (sitesAtPos.length > 0) continue;
                
                // Create site
                const result = room.createConstructionSite(x, y, type);
                if (result === OK) {
                    sitesPlaced++;
                    // console.log(`[AutoPlanner] Placed ${type} at ${x},${y} in ${room.name}`);
                }
            }
            
            if (sitesPlaced >= maxSites) break;
        }
    },
    
    visualize: function(room) {
        const layout = room.memory.layout;
        if (!layout) return;
        
        const visual = new RoomVisual(room.name);
        for (const type in layout) {
            const color = type === 'road' ? '#555' : 
                          type === 'extension' ? '#e8e835' : 
                          type === 'spawn' ? '#ff0000' : '#fff';
            
            for (const pos of layout[type]) {
                visual.circle(pos[0], pos[1], { radius: 0.2, fill: color, opacity: 0.5 });
            }
        }
    }
};

export default AutoPlanner;
