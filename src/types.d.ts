// Ensure lodash is available globally
// import * as _ from 'lodash';

// declare global {
    // const _: _.LoDashStatic;
    
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
        tasks?: any[];
        spawnQueue?: any[];
        remoteTasks?: { [key: string]: any };
        insectNameManager?: {
            names: string[];
            index: number;
        };
        [key: string]: any;
    }

    interface Memory {
        settings?: {
            useAutoRoomSpawn?: boolean;
            showSpawnQueue?: boolean;
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
