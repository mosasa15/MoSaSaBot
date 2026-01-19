import InsectNameManager from '@/module/creepNameManager';
import { QUEUE_CONFIG, ROLE_CONFIGS } from '@/structure/Spawn/constants/spawnConfig';  // 引入常量配置
import { getCpuMultiplier, getCpuTier } from '@/utils/cpuPolicy.js';

// CPU监控工具函数
const DEBUG_MODE = true; // 通过 Memory 或全局变量控制
const withCpuMonitor = (methodName, func) => {
    return function(...args) {
        if (!DEBUG_MODE) return func; // 非调试模式直接返回原函数
        const startCpu = Game.cpu.getUsed();
        const startTime = Game.time;
        
        try {
            return func.apply(this, args);
        } finally {
            const usedCpu = Game.cpu.getUsed() - startCpu;
            const duration = Game.time - startTime;
            //console.log(`[性能] ${methodName} CPU消耗: ${usedCpu.toFixed(2)} 执行时长: ${duration}t`);
        }
    };
};

export default {
    /**
     * 主运行函数 - 遍历所有房间并处理生成逻辑
     */
    run: withCpuMonitor('SpawnManager.run', function() {
        const tier = getCpuTier();
        const multiplier = getCpuMultiplier();
        if (!global.cpuTierState) global.cpuTierState = { tier, lowStreak: 0 };
        if (tier === 'low') global.cpuTierState.lowStreak = Math.min(20, (global.cpuTierState.lowStreak || 0) + 1);
        else global.cpuTierState.lowStreak = 0;
        global.cpuTierState.tier = global.cpuTierState.lowStreak >= 5 ? 'low' : tier;

        global.cpuTier = global.cpuTierState.tier;
        global.cpuMultiplier = global.cpuTier === 'low' ? 0.5 : multiplier;
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if( !room.controller || !room.controller.my ) continue;
            //console.log(room.name);
            this.processRoom(room);
            this.processQueue(room);
        }
    }),

    /**
     * 处理单个房间的生成逻辑
     * @param {Room} room - 要处理的房间对象
     */
    processRoom: withCpuMonitor('SpawnManager.processRoom', function(room) {
        if (!room.controller || !room.controller.my) return;
        
        // 安全初始化队列内存和任务列表
        if (!Memory.rooms) Memory.rooms = {};
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].spawnQueue) Memory.rooms[room.name].spawnQueue = [];
        if (!Memory.rooms[room.name].tasks) Memory.rooms[room.name].tasks = [];

        // 检查房间能量是否不足
        const tasksList = Memory.rooms[room.name].tasks;
        if (room.energyAvailable < room.energyCapacityAvailable * 0.7 && 
            !tasksList.some(task => task.type === 'fillExtension')) {
            tasksList.push({ type: 'fillExtension' });
            // console.log(`房间 ${room.name} 能量不足，已推送 fillExtension 任务。`);
            return;
        }

        const tasks = this.generateTasks(room);
        this.executeTasks(room, tasks);
    }),

    /**
     * 根据房间的控制器等级和能量上限生成任务
     * @param {Room} room - 当前房间
     */
    generateTasks: withCpuMonitor('SpawnManager.generateTasks', function(room) {
        const tasks = [];

        // 初始化与统计逻辑
        if (!global.creepNumCheckLastTime || global.creepNumCheckLastTime !== Game.time) {
            // 重置为全新对象，避免跨 tick 数据污染
            global.creepNum = {}; 
            global.creepNumCheckLastTime = Game.time;
            
            // 预初始化所有存在内存的房间（重要改进）
            if (!Memory.rooms) Memory.rooms = {}; // Ensure Memory.rooms exists
            for (const roomName in Memory.rooms) {
                if (!global.creepNum[roomName]) {
                    global.creepNum[roomName] = {};
                    // 为每个角色预设初始值
                    for (const role in ROLE_CONFIGS) {
                        global.creepNum[roomName][role] = 0;
                    }
                }
            }
            // 遍历所有 creep 进行统计（优化后的版本）
            for (const creepName in Game.creeps) {
                const creep = Game.creeps[creepName];
                if (!creep) continue;
                
                const role = creep.memory.role;
                let home = creep.memory.home;
                if (!home) home = creep.memory.sourceRoomName || creep.memory.targetRoomName;
                if (!role || !home) continue;
                if (!creep.memory.home) creep.memory.home = home;
                // 确保房间记录存在
                if (!global.creepNum[home]) {
                    global.creepNum[home] = {};
                    // 初始化所有可能的角色
                    for (const r in ROLE_CONFIGS) {
                        global.creepNum[home][r] = 0;
                    }
                }
                // 安全累加
                if (global.creepNum[home][role] !== undefined) {
                    global.creepNum[home][role]++;
                } else {
                    //console.log(`警告：发现未定义角色 ${role} 在房间 ${home}`);
                    global.creepNum[home][role] = 1; // 动态创建字段
                }
            }
        }

        const roomCounts = global.creepNum[room.name] || {};
        if ((roomCounts.harvester || 0) === 0 && room.energyAvailable >= 200) {
            tasks.push({
                role: 'harvester',
                priority: 100,
                valid: true,
                body: getAffordableBody('harvester', room.energyAvailable)
            });
        }
        if ((roomCounts.upgrader || 0) === 0 && room.controller && room.controller.my && room.controller.level < 8 && room.energyAvailable >= 200) {
            tasks.push({
                role: 'upgrader',
                priority: 90,
                valid: true,
                body: getAffordableBody('upgrader', room.energyAvailable)
            });
        }

        // 添加新增角色的任务
        if (Game.time % 1 === 0) {
            for (const [role, config] of Object.entries(ROLE_CONFIGS)) {
                // Ensure global.creepNum has entry for this room
                if (!global.creepNum[room.name]) global.creepNum[room.name] = {};
                
                const currentLimit = typeof config.limit === 'function' ? config.limit(room) : config.limit;
                const count = global.creepNum[room.name][role] || 0;
                //console.log(role,currentLimit,count);
                // 如果满足生成条件且数量未达到上限，添加生成任务
                if (config.condition(room) && count < currentLimit) {
                    tasks.push({
                        role,
                        priority: config.priority,
                        valid: true,
                        body: this.getBodyForRoom(room, role)  // 使用控制器等级和能量上限来决定身体部件
                    });
                }
            }
        }

        // 输出当前生成任务列表
        if (tasks.length > 0) {
            // console.log(`[${room.name}] 当前生成任务: ${tasks.map(task => task.role).join(', ')}`);
            // console.log(`[${room.name}] 当前 ${tasks[0].role} 数量:`, global.creepNum[room.name][tasks[0].role] );
        }
    
        return tasks.filter(task => task.valid).sort((a, b) => b.priority - a.priority);
    }),

    /**
     * 根据房间的控制器等级和能量容量获取合适的身体部件
     * @param {Room} room - 房间对象
     * @param {string} role - 角色名称
     * @returns {Array} 角色的身体部件配置
     */
    getBodyForRoom: withCpuMonitor('SpawnManager.getBodyForRoom', function(room, role) {
        const config = ROLE_CONFIGS[role];
        if (!config) return [WORK, CARRY, MOVE];
        
        const controllerLevel = room.controller.level;  // 获取控制器等级
        //const energyCapacity = room.energyCapacityAvailable;  // 获取房间的最大能量容量
        //console.log(controllerLevel);
        //console.log(config.body);
        // 获取控制器等级对应的身体部件配置
        const bodyConfig = config.body[controllerLevel];
        return bodyConfig || [WORK, CARRY, MOVE]; // Fallback
    }),

    /**
     * 将任务加入生成队列（内存）
     * @param {Room} room - 房间对象
     * @param {Array} tasks - 待处理任务列表
     */
    executeTasks: withCpuMonitor('SpawnManager.executeTasks', function(room, tasks) {
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].spawnQueue) Memory.rooms[room.name].spawnQueue = [];
        
        const spawnQueue = Memory.rooms[room.name].spawnQueue; // 获取当前房间的生成队列
        
        for (const task of tasks) { // 遍历待处理的任务列表
            const body = task.body; // 获取任务的身体部件配置
            if (!body || body.length === 0 || body.length > 50) continue; // 检查身体部件的有效性，长度必须在 1 到 50 之间
            // 检查生成队列中是否已存在相同角色的任务
            const existingTask = spawnQueue.find(t => t.role === task.role);
            if ( existingTask ) { // 如果找到了相同角色的任务
                // 如果新任务的优先级更高，则替换旧任务
                if (task.priority > existingTask.priority) {
                    const index = spawnQueue.indexOf(existingTask); // 获取旧任务的索引
                    spawnQueue[index] = { // 替换旧任务
                        role: task.role,
                        body: body,
                        priority: task.priority,
                        cost: calculateCost(body) // 计算新任务的能量成本
                    };
                }
                continue; // 继续处理下一个任务
            } else {
                spawnQueue.push({ // 将新任务添加到生成队列
                    role: task.role,
                    body: body,
                    priority: task.priority,
                    cost: calculateCost(body) // 计算任务的能量成本
                });
            }
        }
        spawnQueue.sort((a, b) => b.priority - a.priority); // 按优先级对生成队列进行排序
    }),

    /**
     * 处理生成队列（实际调用spawn）
     * @param {Room} room - 房间对象
     */
    processQueue: withCpuMonitor('SpawnManager.processQueue', function(room) {
        if (!Memory.rooms[room.name]) return;
        const queue = Memory.rooms[room.name].spawnQueue; // 获取当前房间的生成队列

        if (!queue || queue.length === 0) return; // 如果队列为空，则直接返回

        const spawns = room.find(FIND_MY_SPAWNS); // 查找所有空闲的 spawn
        if (spawns.length === 0) return; // 如果没有可用的 spawn，则直接返回

        let remainingEnergy = room.energyAvailable;
        //const roomEnergyCapacity = room.energyCapacityAvailable;

        //let processedCount = 0; // 记录已处理的任务数量
        let parallelLimit = QUEUE_CONFIG.MAX_PARALLEL_TASKS;
        const tier = global.cpuTier || 'normal';
        if (tier === 'low') parallelLimit = 1;
        else if (tier === 'high') parallelLimit = 5;
        const idleSpawns = spawns.filter(s => !s.spawning);
        const maxSpawnsToUse = Math.min(idleSpawns.length, Math.min(queue.length, parallelLimit));

        //this.cleanupQueue(queue, roomEnergyCapacity);
        // 遍历队列并按顺序分配任务
        for (let spawnIndex = 0; spawnIndex < maxSpawnsToUse; spawnIndex++) {
            const spawn = idleSpawns[spawnIndex];
            if (!spawn) continue;
            for (let taskIndex = 0; taskIndex < queue.length; taskIndex++) {
                const task = queue[taskIndex];
                if (!task) continue;
                let body = task.body;
                let cost = task.cost;
                if (cost > remainingEnergy) {
                    body = getAffordableBody(task.role, remainingEnergy);
                    if (!body || body.length === 0) continue;
                    cost = calculateCost(body);
                }
                if (cost > remainingEnergy) continue;
                if (this.tryAssignTask(spawn, task, body)) {
                    remainingEnergy -= cost;
                    queue.splice(taskIndex, 1);
                    break;
                }
            }
        }
        this.drawSpawnStatus(room); // 调用可视化绘制方法
    }),

    tryAssignTask: withCpuMonitor('SpawnManager.tryAssignTask', function(spawn, task, bodyOverride) {
        const room = spawn.room;
        const role = task.role;
        
        const existingCreeps = Object.values(Game.creeps).filter(creep =>
            creep &&
            creep.memory &&
            creep.memory.role === role &&
            creep.memory.home === room.name
        );
        
        // 生成连续可用编号算法（保持原有逻辑）
        const existingWorkLocs = new Set(
            existingCreeps.map(c => c.memory.workLoc)
        );
        let workLoc = 0;
        while (existingWorkLocs.has(workLoc)) workLoc++;

        // 获取角色基础内存配置
        const roleConfig = ROLE_CONFIGS[role];
        const baseMemory = (roleConfig && typeof roleConfig.memory === 'function')
            ? roleConfig.memory(room) 
            : {};
        

        // 构建合并内存（保留workLoc/home）
        const mergedMemory = {
            ...baseMemory,          // 角色基础配置
            workLoc: workLoc,       // 添加工位号
            home: room.name,        // 记录所属房间
            role: role              // 确保role字段优先级最高
        };
    
        const name = InsectNameManager.registerName(room);
        const body = bodyOverride || task.body;
        const result = spawn.spawnCreep(body, name, {
            memory: mergedMemory
        });
    
        if (result === OK) {
            console.log(`[${room.name}] 成功生成 ${task.role}，名称: ${name}，workLoc: ${workLoc}`);
            return true;
        } else {
            // console.log(`[${room.name}] 生成失败 ${result}，角色：${role}`);
            return false;
        }
    }),

    cleanupQueue: withCpuMonitor('SpawnManager.cleanupQueue', function(queue, maxEnergy) {
        for (let i = queue.length - 1; i >= 0; i--) {
            const task = queue[i];
            if (task.cost > maxEnergy) {
                const removedTask = queue.splice(i, 1)[0];
                console.log(`[队列清理] 移除无法生产的任务: ${removedTask.role}，所需能量: ${removedTask.cost}`);
            }
        }
    }),

    // 新增方法：绘制 spawn 状态
    drawSpawnStatus: withCpuMonitor('SpawnManager.drawSpawnStatus', function(room) {
        const spawns = room.find(FIND_MY_SPAWNS);
        const visual = new RoomVisual(room.name);
        const queueLen = (Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].spawnQueue)
            ? Memory.rooms[room.name].spawnQueue.length
            : 0;
        const tier = global.cpuTier || 'normal';
        const mult = global.cpuMultiplier || 1;
        const showQueue = !Memory.settings || Memory.settings.showSpawnQueue !== false;
        const queue = (Memory.rooms && Memory.rooms[room.name] && Memory.rooms[room.name].spawnQueue)
            ? Memory.rooms[room.name].spawnQueue
            : [];
        const anchor = spawns && spawns.length > 0 ? spawns[0].pos : null;
        if (showQueue && anchor) {
            const maxLines = 10;
            const startX = Math.min(49, anchor.x + 1);
            let y = Math.min(49, anchor.y + 1.6);
            visual.text(
                `Queue:${queueLen} E:${room.energyAvailable}/${room.energyCapacityAvailable} CPU:${tier}×${mult}`,
                startX,
                y,
                { align: 'left', fontSize: 0.45, opacity: 0.75, color: '#ffffff' }
            );
            y += 0.55;
            for (let i = 0; i < Math.min(maxLines, queue.length); i++) {
                const t = queue[i];
                const role = t && t.role ? t.role : 'unknown';
                const prio = t && typeof t.priority === 'number' ? t.priority : 0;
                const cost = t && typeof t.cost === 'number' ? t.cost : 0;
                const ok = cost <= room.energyAvailable ? '✓' : '✗';
                visual.text(
                    `${i + 1}. ${role} p:${prio} c:${cost} ${ok}`,
                    startX,
                    y,
                    { align: 'left', fontSize: 0.45, opacity: 0.7, color: ok === '✓' ? '#9cff9c' : '#ff9c9c' }
                );
                y += 0.5;
                if (y > 49) break;
            }
        }

        for (const spawn of spawns) {
            if (spawn.spawning) {
                // 生成中的状态
                const creep = Game.creeps[spawn.spawning.name];
                const role = creep ? creep.memory.role : 'Unknown';
                const remaining = spawn.spawning.remainingTime;
                visual.text(
                    `🛠️${role} ${remaining}s`,
                    spawn.pos.x + 1,
                    spawn.pos.y + 0.25,
                    { 
                        align: 'left',
                        fontSize: 0.5,
                        opacity: 0.8,
                        color: '#ffe56d'
                    }
                );
            } else {
                // 空闲状态
                visual.text(
                    '✅空闲',
                    spawn.pos.x + 1,
                    spawn.pos.y + 0.25,
                    { 
                        align: 'left',
                        fontSize: 0.5,
                        opacity: 0.8,
                        color: '#6df46d'
                    }
                );

                if (queueLen > 0) {
                    const task = Memory.rooms[room.name].spawnQueue[0];
                    const cost = task ? task.cost : 0;
                    visual.text(
                        `Q:${queueLen} E:${room.energyAvailable}/${room.energyCapacityAvailable} C:${cost}`,
                        spawn.pos.x + 1,
                        spawn.pos.y + 0.85,
                        {
                            align: 'left',
                            fontSize: 0.45,
                            opacity: 0.7,
                            color: '#cfd7ff'
                        }
                    );
                } else {
                    visual.text(
                        `Q:0 CPU:${tier}×${mult}`,
                        spawn.pos.x + 1,
                        spawn.pos.y + 0.85,
                        {
                            align: 'left',
                            fontSize: 0.45,
                            opacity: 0.6,
                            color: '#cfd7ff'
                        }
                    );
                }
            }
        }
    }),
};

/**
 * 计算身体部件能量成本
 * @param {Array} body - 身体部件数组
 * @returns {number} 总能量成本
 */
function calculateCost(body) {
    if (!body) return 0;
    return body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
}

function getAffordableBody(role, energyAvailable) {
    let pattern;
    if (role === 'manager' || role === 'transferer' || role === 'Centraltransferer' || role === 'thinker') {
        pattern = [CARRY, MOVE];
    } else {
        pattern = [WORK, CARRY, MOVE];
    }
    const maxParts = 50;
    const costOf = (parts) => parts.reduce((sum, part) => sum + BODYPART_COST[part], 0);
    const baseCost = costOf(pattern);
    if (energyAvailable < baseCost) return [];
    let body = [...pattern];
    let cost = baseCost;
    while (body.length + pattern.length <= maxParts && cost + baseCost <= energyAvailable) {
        body = body.concat(pattern);
        cost += baseCost;
    }
    return body;
}
