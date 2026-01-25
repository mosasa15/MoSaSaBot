// Ensure lodash is available globally
// import * as _ from 'lodash';

// declare global {
    // const _: _.LoDashStatic;
    
    type SpawnQueueItem = {
        role: string;
        priority: number;
        body?: BodyPartConstant[];
        cost?: number;
        workLoc?: number;
        valid?: boolean;
        [key: string]: any;
    };
    
    type LegacyRoomTask = { type: string; [key: string]: any };
    
    interface CreepMemory {
        role: string;
        sourceRoomName?: string;
        targetRoomName?: string;
        workLoc?: number;
        dontPullMe?: boolean;
        home?: string;
        [key: string]: any;
    }

    interface RoomMemory {
        tasks?: LegacyRoomTask[];
        spawnQueue?: SpawnQueueItem[];
        remoteTasks?: Record<string, any>;
        state?: Record<string, any>;
        taskQueue?: any[];
        economy?: Record<string, any>;
        defense?: Record<string, any>;
        insectNameManager?: {
            names: string[];
            index: number;
        };
        [key: string]: any;
    }

    interface Memory {
        schemaVersion?: number;
        intel?: Record<string, any>;
        stats?: Record<string, any>;
        resourceSources?: Record<string, string[]>;
        diplomacy?: {
            allies: string[];
            enemies: string[];
            self?: string;
        };
        settings?: {
            useAutoRoomSpawn?: boolean;
            showSpawnQueue?: boolean;
            logLevel?: 'debug' | 'info' | 'warn' | 'error';
            systems?: {
                remoteOps?: boolean;
                market?: boolean;
                hud?: boolean;
                metrics?: boolean;
            };
        };
        profiler?: any;
        [key: string]: any;
    }

    declare namespace NodeJS {
        interface Global {
            nextTickClear: string[];
            Memory: Memory;
            ResourceController?: any;
            RES_COLOR_MAP?: any;
            RES_TREE?: any;
            roomResSvg?: any;
            roomResEcharts?: any;
            HelperRoomResource?: any;
            cpuTierState?: any;
            cpuTier?: any;
            cpuMultiplier?: any;
            creepNumCheckLastTime?: number;
            creepNum?: any;
            layoutCache?: any;
            
            // Chat & Command Globals
            TalkAll?: () => void;
            Talk?: string[];
            A?: () => void;
            help?: () => void;
            pushTask?: (roomName: string, type: string) => void;
            removeTask?: (roomName: string, type: string) => void;
            addPassage?: (targetRoomName: string, passageRoomName: string) => void;
            requireResource?: (id: string, resource: string, num: number, roomName: string, shard: string, state: string, des: string) => void;
        }
    }
    
    // Extensions to existing Screeps interfaces
    interface Game {
        profiler: any;
    }

    interface Room {
        // Properties added by your bot's prototypes/extensions
        spawn: StructureSpawn[];
        extension: StructureExtension[];
        road: StructureRoad[];
        wall: StructureWall[];
        rampart: StructureRampart[];
        keeperLair: StructureKeeperLair[];
        portal: StructurePortal[];
        link: StructureLink[];
        tower: StructureTower[];
        lab: StructureLab[];
        container: StructureContainer[];
        powerBank: StructurePowerBank[];
        observer?: StructureObserver;
        powerSpawn?: StructurePowerSpawn;
        extractor?: StructureExtractor;
        nuker?: StructureNuker;
        factory?: StructureFactory;
        invaderCore?: StructureInvaderCore;
        mineral?: Mineral;
        source: Source[];
        deposit: Deposit[];
        mass_stores: (StructureStorage | StructureTerminal | StructureFactory | StructureContainer)[];
        my: boolean;
        level: number;
    }

    interface Creep {
        randomSay(chance?: number): void;
    }
// }
