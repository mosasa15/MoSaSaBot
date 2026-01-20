// modules/constants/spawnConfig.js
declare const _: any;
import { DOWNGRADE_PROTECTION } from '@/config/protectionConfig';

/**
 * 队列配置常量：每个房间同时处理的最大生成任务数
 */
export const QUEUE_CONFIG = {
    MAX_PARALLEL_TASKS: 3  // 基于房间内spawn数量的并行任务上限
};

/**
 * 不同角色在 1 - 8 级时对应的身体部件配置
 * spawn 在孵化时会根据所处房间的可用能量自动调整身体部件
 */
const getBodyConfig = function(...bodySets) {
    let config = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
    
    // 遍历空配置项，用传入的 bodySet 依次生成配置项
    Object.keys(config).forEach((level, index) => {
        config[level] = calcBodyPart(bodySets[index]);
    });

    return config;
};

/**
 * 角色配置中心
 * 每个角色的身体部件根据等级线性增加
 */
export const ROLE_CONFIGS = {
    // 救世主 - 防止掉级
    savior: {
        body: getBodyConfig(
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 }, // Min: 2W 1C 1M
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 4, [CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 6, [CARRY]: 3, [MOVE]: 3 },
            { [WORK]: 8, [CARRY]: 4, [MOVE]: 4 },
            { [WORK]: 10, [CARRY]: 5, [MOVE]: 5 },
            { [WORK]: 15, [CARRY]: 5, [MOVE]: 10 },
            { [WORK]: 15, [CARRY]: 5, [MOVE]: 10 }
        ),
        priority: 100,
        condition: room => {
            const controller = room.controller;
            return controller && controller.my && 
                   controller.ticksToDowngrade < DOWNGRADE_PROTECTION.CRITICAL_THRESHOLD_TICKS;
        },
        limit: 1,
        memory: (room) => ({
            role: 'savior', 
            upgrading: true // Ensure it starts working immediately if possible
        })
    },

    // 早期升级者 - 快速冲级 (RCL 1)
    earlyUpgrader: {
        body: getBodyConfig(
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 }, // Min: 2W 1C 1M (Cost: 300)
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 }
        ),
        priority: 10, // Higher than harvester (8)
        condition: room => {
            const controller = room.controller;
            return controller && controller.my && controller.level === 1;
        },
        limit: 1, // One is enough to rush to RCL 2 quickly
        memory: (room) => ({
            role: 'earlyUpgrader',
            upgrading: true
        })
    },

    // 采集者 - 专注于能量采集
    harvester: {
        body: getBodyConfig(
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 4, [CARRY]: 1, [MOVE]: 2 },
            { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            { [WORK]: 10, [CARRY]: 1, [MOVE]: 5 },
            { [WORK]: 12, [CARRY]: 1, [MOVE]: 6 },
            { [WORK]: 12, [CARRY]: 1, [MOVE]: 6 },
            { [WORK]: 12, [CARRY]: 1, [MOVE]: 6 }
        ),
        priority: 8,
        condition: room => {
            const sources = room.source || room.find(FIND_SOURCES);
            return sources && sources.length > 0;
        },
        limit: room => {
            const sources = room.source || room.find(FIND_SOURCES);
            
            // Low Level (RCL <= 2): Allow multiple harvesters based on available spaces
            if (room.controller && room.controller.level <= 2) {
                let totalSpaces = 0;
                const terrain = room.getTerrain();
                sources.forEach(source => {
                    let spaces = 0;
                    for (let x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
                        for (let y = source.pos.y - 1; y <= source.pos.y + 1; y++) {
                            if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                                spaces++;
                            }
                        }
                    }
                    totalSpaces += spaces; // Strictly cap by available spaces
                });
                return totalSpaces;
            }

            // Standard: 1 harvester per source
            return sources.length;
        },
        //limit: 0,
        memory: (room) => ({
            role: 'harvester',
            // sourceId: null,       // 由生成逻辑动态分配
            // containerId: null,     // 关联的容器ID
            // state: 'harvesting'    // 工作状态：harvesting/transferring
        })
    },
    wallRepairer: {
        body: getBodyConfig(
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 4, [CARRY]: 1, [MOVE]: 2 },
            { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 8, [CARRY]: 1, [MOVE]: 4 },
            { [WORK]: 10, [CARRY]: 1, [MOVE]: 5 },
            { [WORK]: 10, [CARRY]: 6, [MOVE]: 10 },
            { [WORK]: 34, [CARRY]: 6, [MOVE]: 10 },
            { [WORK]: 34, [CARRY]: 6, [MOVE]: 10 }
        ),
        priority: 3,
        condition: (room) => {
            // 检查控制器等级
            if (room.controller.level < 7) return false;
            
            // 检查能量储备
            const storage = room.storage;
            const terminal = room.terminal;
            const totalEnergy = (storage ? storage.store[RESOURCE_ENERGY] : 0) + 
                                (terminal ? terminal.store[RESOURCE_ENERGY] : 0);
            return totalEnergy > 300000;
        },
        limit: 1,
        memory: (room) => ({
            role: 'wallRepairer',
            // sourceId: null,       // 由生成逻辑动态分配
            // containerId: null,     // 关联的容器ID
            // state: 'harvesting'    // 工作状态：harvesting/transferring
        })
    },
// ... existing code ...
    // 升级者 - 专注于控制器升级
    upgrader: {
        body: getBodyConfig(
            { [WORK]: 1, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 3, [CARRY]: 3, [MOVE]: 3 },
            { [WORK]: 4, [CARRY]: 4, [MOVE]: 4 },
            { [WORK]: 6, [CARRY]: 6, [MOVE]: 6 },
            { [WORK]: 9, [CARRY]: 9, [MOVE]: 9 },
            { [WORK]: 17, [CARRY]: 9, [MOVE]: 17 },
            { [WORK]: 12, [CARRY]: 12, [MOVE]: 12 }
        ),
        priority: 7,
        condition: room => {
            const controller = room.controller;
            if (!controller || !controller.my) return false;
            // Only start regular upgrader from RCL 2, let earlyUpgrader handle RCL 1
            if (controller.level < 2) return false;
            if (controller.level >= 8) return false;
            if (controller.level <= 3) return true;
            // Configurable threshold check
            const maxTicks = (CONTROLLER_DOWNGRADE && CONTROLLER_DOWNGRADE[controller.level]) || 0;
            if (maxTicks && controller.ticksToDowngrade < maxTicks * DOWNGRADE_PROTECTION.WARNING_THRESHOLD_PERCENT) return true;
            
            const storageEnergy = room.storage ? (room.storage.store[RESOURCE_ENERGY] || 0) : 0;
            const terminalEnergy = room.terminal ? (room.terminal.store[RESOURCE_ENERGY] || 0) : 0;
            return storageEnergy + terminalEnergy >= 30000;
        },
        limit: (room) => {
            const cpuMultiplier = global.cpuMultiplier || 1;
            const storedEnergy = room.storage ? (room.storage.store[RESOURCE_ENERGY] || 0) : 0;
            if (storedEnergy < 20000) return 1;
            return Math.min(3, Math.max(1, Math.ceil(cpuMultiplier)));
        },
        memory: (room) => ({
            role: 'upgrader',
            // controllerId: room.controller.id, // 绑定房间控制器
            // sourceId: room.storage?.id || null, // 能量来源
            // state: 'upgrading'               // 工作状态：collecting/upgrading
        })
    },

    // 防御者 - 动态应对威胁
    defenser: {
        body: getBodyConfig(
            { [MOVE]: 1, [ATTACK]: 1 },
            { [MOVE]: 2, [ATTACK]: 2 },
            { [MOVE]: 3, [ATTACK]: 3 },
            { [MOVE]: 4, [ATTACK]: 4 },
            { [MOVE]: 5, [ATTACK]: 5 },
            { [MOVE]: 6, [ATTACK]: 6 },
            { [ATTACK]: 40, [MOVE]: 10 },
            { [RANGED_ATTACK]: 40, [MOVE]: 10}
        ),
        priority: 9,
        condition: room => room.find(FIND_HOSTILE_CREEPS, {
            filter: creep =>  creep.owner.username !== 'Invader'
        }).length > 0,
        limit: 0,
        memory: (room) => ({
            role: 'defenser',
            // patrolRoute: [],       // 巡逻路径坐标数组
            // combatMode: 'patrol', // 战斗模式：patrol/attack
            // targetId: null        // 当前攻击目标
        })
    },

    // 建造者 - 建筑单位
    builder: {
        body: getBodyConfig(
            { [WORK]: 1, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 2, [CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 3, [CARRY]: 3, [MOVE]: 3 },
            { [WORK]: 4, [CARRY]: 4, [MOVE]: 4 },
            { [WORK]: 6, [CARRY]: 6, [MOVE]: 6 },
            { [WORK]: 7, [CARRY]: 7, [MOVE]: 7 },
            { [WORK]: 12, [CARRY]: 6, [MOVE]: 9 },
            { [WORK]: 20, [CARRY]: 8, [MOVE]: 14 }
        ),
        priority: 6,
        condition: room => room.find(FIND_CONSTRUCTION_SITES).length > 0,
        limit: (room) => {
            const siteCount = room.find(FIND_MY_CONSTRUCTION_SITES).length;
            if (siteCount <= 0) return 0;
            const rcl = room.controller.level;
            const energyCap = room.energyCapacityAvailable || 0;
            const storedEnergy = room.storage ? (room.storage.store[RESOURCE_ENERGY] || 0) : 0;
            const scale = Math.ceil(siteCount / 10);
            const maxBuilders = rcl <= 3 ? 2 : 6;
            const cpuMultiplier = global.cpuMultiplier || 1;
            let limit = Math.min(maxBuilders, Math.max(1, Math.ceil(scale * cpuMultiplier)));
            if (energyCap < 550 && storedEnergy < 5000) limit = 1;
            return limit;
        },
        memory: (room) => ({
            role: 'builder',
            // constructionSiteId: null, // 当前建造目标
            // energySource: room.storage?.id || null // 能量来源
        })
    },

    // 资源管理者 - 仓储运输
    manager: {
        body: getBodyConfig(
            { [CARRY]: 2, [MOVE]: 1 },
            { [CARRY]: 3, [MOVE]: 2 },
            { [CARRY]: 4, [MOVE]: 2 },
            { [CARRY]: 5, [MOVE]: 3 },
            { [CARRY]: 8, [MOVE]: 4 },
            { [CARRY]: 14, [MOVE]: 7 },
            { [CARRY]: 20, [MOVE]: 10 },
            { [CARRY]: 32, [MOVE]: 16 }
        ),
        priority: 9,
        condition: room => {
            if (room.storage) return true;
            const tasks = Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].tasks
                ? Memory.rooms[room.name].tasks
                : [];
            return tasks.some(t => t.type === 'fillExtension');
        },
        limit: (room) => {
            const cpuMultiplier = global.cpuMultiplier || 1;
            const siteCount = room.find(FIND_MY_CONSTRUCTION_SITES).length;
            const tasks = Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].tasks
                ? Memory.rooms[room.name].tasks
                : [];
            if (!room.storage) return tasks.some(t => t.type === 'fillExtension') ? 1 : 0;
            if (siteCount >= 20) return Math.min(3, Math.max(1, Math.ceil(cpuMultiplier)));
            return 1;
        },
        memory: (room) => ({
            role: 'manager',
            // sourceId: room.storage.id,      // 固定从仓库获取
            // targetId: null,                // 动态分配运输目标
            // resourceType: RESOURCE_ENERGY, // 默认运输能量
            // task: 'balance'                // 任务类型：balance/feedTower
        })
    },

    // 实验室管理员 - 处理化合物
    thinker: {
        body: getBodyConfig(
            { [CARRY]: 2, [MOVE]: 1 },
            { [CARRY]: 3, [MOVE]: 2 },
            { [CARRY]: 4, [MOVE]: 2 },
            { [CARRY]: 5, [MOVE]: 3 },
            { [CARRY]: 8, [MOVE]: 4 },
            { [CARRY]: 14, [MOVE]: 7 },
            { [CARRY]: 20, [MOVE]: 10 },
            { [CARRY]: 32, [MOVE]: 16 }
        ),
        priority: 9,
        condition: room => room.lab && room.find(FIND_HOSTILE_CREEPS).length > 0,
        limit: 0,
        memory: (room) => ({
            role: 'thinker',
            // labId: room.find(FIND_MY_STRUCTURES, { 
            //     filter: s => s.structureType === STRUCTURE_LAB 
            // })[0]?.id || null,
            // reactionType: null    // 当前处理的化合物类型
        })
    },

    // 应急单位 - 紧急能源供应
    emergency: {
        body: getBodyConfig(
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 2,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 },
            { [WORK]: 1,[CARRY]: 2, [MOVE]: 2 }
        ),
        priority: 9,
        condition: room => room.storage && 
                        room.energyAvailable < 1000 && 
                        room.find(FIND_MY_CREEPS, {
                            filter: creep => creep.memory.role === 'manager'
                        }).length === 0,
        limit: 0,
        memory: (room) => ({
            role: 'emergency',
            //sourceId: room.storage.id,      // 应急能源来源
            //targetId: room.spawns[0]?.id,  // 优先供应spawn
            //critical: true                // 紧急任务标志
        })
    },

    // 中央运输者 - 仓储与终端间运输
    Centraltransferer: {
        body: getBodyConfig(
            { [CARRY]: 2, [MOVE]: 1 },
            { [CARRY]: 3, [MOVE]: 2 },
            { [CARRY]: 4, [MOVE]: 2 },
            { [CARRY]: 5, [MOVE]: 3 },
            { [CARRY]: 8, [MOVE]: 4 },
            { [CARRY]: 29, [MOVE]: 1 },
            { [CARRY]: 39, [MOVE]: 1 },
            { [CARRY]: 49, [MOVE]: 1 }
        ),
        priority: 8,
        condition: room => room.storage && room.terminal,
        limit: (room) => {
            const cpuMultiplier = global.cpuMultiplier || 1;
            const storedEnergy = room.storage ? (room.storage.store[RESOURCE_ENERGY] || 0) : 0;
            if (storedEnergy < 50000) return 1;
            return Math.min(3, Math.max(1, Math.ceil(cpuMultiplier)));
        },
        memory: (room) => ({
            role: 'Centraltransferer',
            //sourceId: room.storage.id,      // 固定来源
            //targetId: room.terminal.id,    // 固定目标
            //resourceType: null,            // 根据指令动态调整
            //amount: 1000                   // 单次运输量
        })
    },

    // 侦查兵 - 探索周边房间
    scout: {
        body: getBodyConfig(
            { [MOVE]: 1 },
            { [MOVE]: 1 },
            { [MOVE]: 1 },
            { [MOVE]: 1 },
            { [MOVE]: 1 },
            { [MOVE]: 1 },
            { [MOVE]: 1 },
            { [MOVE]: 1 }
        ),
        priority: 3,
        condition: room => {
            if (room.controller.level < 2) return false;
            if (!room.memory.remoteTasks) return false;
            // Check if there are pending scout tasks
            return _.some(room.memory.remoteTasks, (task: any) => task.type === 'scout');
        },
        limit: 1, // Will spawn based on task availability in memory loop
        memory: (room) => {
            const taskKey = _.findKey(room.memory.remoteTasks, (t: any) => t.type === 'scout');
            const task = room.memory.remoteTasks[taskKey];
            delete room.memory.remoteTasks[taskKey]; // Remove task once assigned (simple queue)
            return {
                role: 'scout',
                targetRoom: task.targetRoom
            };
        }
    },

    // 远程采集者 - 开采外矿
    remoteHarvester: {
        body: getBodyConfig(
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 }, // RCL 1 fallback
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 2 }, // RCL 2 (Move on roads)
            { [WORK]: 3, [CARRY]: 1, [MOVE]: 2 },
            { [WORK]: 4, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 5, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 5, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 5, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 5, [CARRY]: 1, [MOVE]: 3 }
        ),
        priority: 4,
        condition: room => {
            if (room.controller.level < 2) return false;
            if (!room.memory.remoteTasks) return false;
            return _.some(room.memory.remoteTasks, (task: any) => task.type === 'remoteHarvester');
        },
        limit: 2, // Limit concurrent spawns
        memory: (room) => {
            const taskKey = _.findKey(room.memory.remoteTasks, (t: any) => t.type === 'remoteHarvester');
            const task = room.memory.remoteTasks[taskKey];
            delete room.memory.remoteTasks[taskKey];
            return {
                role: 'remoteHarvester',
                targetRoom: task.targetRoom,
                sourceId: task.sourceId,
                taskID: taskKey // Keep track if needed
            };
        }
    },

    // 矿工 - 负责开采矿藏
    miner: {
        body: getBodyConfig(
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 }, // Min: 2W 1C 1M
            { [WORK]: 2, [CARRY]: 1, [MOVE]: 1 },
            { [WORK]: 6, [CARRY]: 1, [MOVE]: 3 },
            { [WORK]: 8, [CARRY]: 2, [MOVE]: 4 },
            { [WORK]: 12, [CARRY]: 2, [MOVE]: 6 },
            { [WORK]: 15, [CARRY]: 4, [MOVE]: 8 },
            { [WORK]: 20, [CARRY]: 4, [MOVE]: 10 },
            { [WORK]: 25, [CARRY]: 5, [MOVE]: 13 }
        ),
        priority: 5,
        condition: room => {
            if (room.controller.level < 6) return false;
            const mineral = room.find(FIND_MINERALS)[0];
            return mineral && mineral.mineralAmount > 0 && 
                   (!room.storage || room.storage.store.getFreeCapacity() > 10000);
        },
        limit: 1,
        memory: (room) => ({ role: 'miner' })
    },
};

// 计算身体部件（保持不变）
function calcBodyPart(partsConfig) {
    let totalParts = [];
    for (let part in partsConfig) {
        totalParts.push(...Array(partsConfig[part]).fill(part));
    }
    return totalParts;
}
