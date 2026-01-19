import Planner from './planner63.js';

const LAYOUT_SCHEMA_VERSION = 20260119;

// Global cache for missing structures to avoid expensive calcs every tick
const missingStructuresCache = {};
// Cache for planned roads to allow quick adjacency checks
const plannedRoadsCache = {};

const structureShapes = {
    "spawn": "◎",
    "extension": "ⓔ",
    "link": "◈",
    "road": "•",
    "constructedWall": "▓",
    "rampart": "⊙",
    "storage": "▤",
    "tower": "🔫",
    "observer": "👀",
    "powerSpawn": "❂",
    "extractor": "⇌",
    "terminal": "✡",
    "lab": "☢",
    "container": "□",
    "nuker": "▲",
    "factory": "☭"
};
const structureColors = {
    "spawn": "cyan",
    "extension": "#0bb118",
    "link": "yellow",
    "road": "#fa6f6f",
    "constructedWall": "#003fff",
    "rampart": "#003fff",
    "storage": "yellow",
    "tower": "cyan",
    "observer": "yellow",
    "powerSpawn": "cyan",
    "extractor": "cyan",
    "terminal": "yellow",
    "lab": "#d500ff",
    "container": "yellow",
    "nuker": "cyan",
    "factory": "yellow"
};

const AutoPlanner = {
    run: function(room) {
        if (!room || !room.controller || !room.controller.my) return;

        if (room.memory.layoutVersion !== LAYOUT_SCHEMA_VERSION) {
            delete room.memory.layout;
            room.memory.layoutVersion = LAYOUT_SCHEMA_VERSION;
            delete missingStructuresCache[room.name];
            delete plannedRoadsCache[room.name];
            if (global.layoutCache) delete global.layoutCache[room.name];
        }
        
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
        
        // Manage Construction Sites (every 10 ticks)
        if (Game.time % 10 === 0) {
            this.manageConstruction(room);
        }
        
        // Visualization
        this.visualize(room);
    },
    
    manageConstruction: function(room) {
        const layout = room.memory.layout;
        if (!layout) return;
        
        const rcl = room.controller.level;
        const bucket = Game.cpu && typeof Game.cpu.bucket === 'number' ? Game.cpu.bucket : 10000;
        const maxSites = Math.min(
            bucket < 2000 ? 10 : 80,
            Math.max(10, rcl * 10 + 10)
        );
        let sitesPlaced = room.find(FIND_MY_CONSTRUCTION_SITES).length;
        
        if (sitesPlaced >= maxSites) return;

        const structures = room.find(FIND_STRUCTURES);
        const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
        const existingTypeSet = new Set();
        const blockedPosSet = new Set();
        for (const s of structures) {
            existingTypeSet.add(`${s.pos.x},${s.pos.y},${s.structureType}`);
            if (s.structureType !== STRUCTURE_RAMPART) blockedPosSet.add(`${s.pos.x},${s.pos.y}`);
        }
        for (const s of constructionSites) {
            existingTypeSet.add(`${s.pos.x},${s.pos.y},${s.structureType}`);
            if (s.structureType !== STRUCTURE_RAMPART) blockedPosSet.add(`${s.pos.x},${s.pos.y}`);
        }
        
        // Priority Order
        const priority = [
            'spawn', 'extension', 'tower', 'storage', 'container',
            'road',
            'link', 'extractor', 'terminal', 'lab', 'factory',
            'nuker', 'powerSpawn', 'observer', 'rampart', 'constructedWall'
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

                const key = `${x},${y}`;
                const typedKey = `${x},${y},${type}`;
                if (existingTypeSet.has(typedKey)) continue;
                if (type === STRUCTURE_RAMPART) {
                    if (existingTypeSet.has(`${x},${y},${STRUCTURE_RAMPART}`)) continue;
                } else {
                    if (blockedPosSet.has(key)) continue;
                }
                
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
        if (!room.memory.layout) return;
        
        // Update cache every 20 ticks
        if (!missingStructuresCache[room.name] || Game.time % 20 === 0) {
            this.updateMissingStructuresCache(room);
        }
        
        const missing = missingStructuresCache[room.name];
        if (!missing || missing.length === 0) return;
        
        const visual = new RoomVisual(room.name);
        const plannedRoads = plannedRoadsCache[room.name] || new Set();

        for (const item of missing) {
            if (item.type === 'road') {
                // Draw circle (node) - smaller as requested
                visual.circle(item.x, item.y, {
                    radius: 0.1,
                    fill: structureColors[item.type],
                    opacity: 0.2
                });

                // Draw lines to neighbors that are also planned roads
                // This connects the missing road to the rest of the planned network (built or unbuilt)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        
                        const nx = item.x + dx;
                        const ny = item.y + dy;
                        
                        // Check if neighbor is a planned road
                        if (plannedRoads.has(`${nx},${ny}`)) {
                            visual.line(item.x, item.y, nx, ny, {
                                color: structureColors[item.type],
                                opacity: 0.2,
                                width: 0.1
                            });
                        }
                    }
                }
            } else {
                visual.text(structureShapes[item.type] || '?', item.x, item.y + 0.2, {
                    color: structureColors[item.type],
                    opacity: 0.3, // Low opacity as requested
                    font: 0.5
                });
            }
        }
    },

    updateMissingStructuresCache: function(room) {
        const layout = room.memory.layout;
        const structures = room.find(FIND_STRUCTURES);
        const constructionSites = room.find(FIND_CONSTRUCTION_SITES);
        
        // Build a map of existing things
        const existingMap = new Set();
        const addToMap = (s) => existingMap.add(`${s.pos.x},${s.pos.y},${s.structureType}`);
        
        structures.forEach(addToMap);
        constructionSites.forEach(addToMap);
        
        // Build planned roads cache for this room
        const roadSet = new Set();
        if (layout.road) {
            for (const pos of layout.road) {
                roadSet.add(`${pos[0]},${pos[1]}`);
            }
        }
        plannedRoadsCache[room.name] = roadSet;

        const missing = [];
        for (const type in layout) {
            for (const pos of layout[type]) {
                const x = pos[0];
                const y = pos[1];
                if (!existingMap.has(`${x},${y},${type}`)) {
                    missing.push({x, y, type});
                }
            }
        }
        missingStructuresCache[room.name] = missing;
    }
};

export default AutoPlanner;
