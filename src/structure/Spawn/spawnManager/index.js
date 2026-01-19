import InsectNameManager from '@/module/creepNameManager';
import { QUEUE_CONFIG, ROLE_CONFIGS } from '@/structure/Spawn/constants/spawnConfig';  // 引入常量配置

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
        for (const room of Object.values(Game.rooms)) {
            if( !room.my ) continue;
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
        if (!room.controller.my) return;
        
        // 安全初始化队列内存和任务列表
        if (!Memory.rooms[room.name]) Memory.rooms[room.name] = {};
        if (!Memory.rooms[room.name].spawnQueue) Memory.rooms[room.name].spawnQueue = [];
        if (!Memory.rooms[room.name].tasks) Memory.rooms[room.name].tasks = [];

        // 检查房间能量是否不足
        const tasksList = Memory.rooms[room.name].tasks;
        if (room.energyAvailable < room.energyCapacityAvailable * 0.7 && 
            !tasksList.some(task => task.type === 'fillExtension')) {
            tasksList.push({ type: 'fillExtension' });
            console.log(`房间 ${room.name} 能量不足，已推送 fillExtension 任务。`);
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
            for (const creep of Object.values(Game.creeps)) {
                const { role, home } = creep.memory;
                if (!role || !home) continue;
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

        ///console.log(global.creepNum['E58N14']['manager']);

        // 添加新增角色的任务
        if (Game.time % 1 === 0) {
            for (const [role, config] of Object.entries(ROLE_CONFIGS)) {
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
            console.log(`[${room.name}] 当前生成任务: ${tasks.map(task => task.role).join(', ')}`);
            console.log(`[${room.name}] 当前 ${tasks[0].role} 数量:`, global.creepNum[room.name][tasks[0].role] );
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
        const controllerLevel = room.controller.level;  // 获取控制器等级
        //const energyCapacity = room.energyCapacityAvailable;  // 获取房间的最大能量容量
        //console.log(controllerLevel);
        //console.log(config.body);
        // 获取控制器等级对应的身体部件配置
        const bodyConfig = config.body[controllerLevel];
        return bodyConfig;
    }),

    /**
     * 将任务加入生成队列（内存）
     * @param {Room} room - 房间对象
     * @param {Array} tasks - 待处理任务列表
     */
    executeTasks: withCpuMonitor('SpawnManager.executeTasks', function(room, tasks) {
        const spawnQueue = Memory.rooms[room.name].spawnQueue; // 获取当前房间的生成队列
        
        for (const task of tasks) { // 遍历待处理的任务列表
            const body = task.body; // 获取任务的身体部件配置
            if (body.length === 0 || body.length > 50) continue; // 检查身体部件的有效性，长度必须在 1 到 50 之间
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
            
            // // 如果队列中没有相同角色的任务，并且可以生成新的 creep
            // if (this.shouldSpawn(room, task.role, body.length)) {
            //     spawnQueue.push({ // 将新任务添加到生成队列
            //         role: task.role,
            //         body: body,
            //         priority: task.priority,
            //         cost: calculateCost(body) // 计算任务的能量成本
            //     });
            // }
        }
        spawnQueue.sort((a, b) => b.priority - a.priority); // 按优先级对生成队列进行排序
    }),

    /**
     * 处理生成队列（实际调用spawn）
     * @param {Room} room - 房间对象
     */
    processQueue: withCpuMonitor('SpawnManager.processQueue', function(room) {
        const queue = Memory.rooms[room.name].spawnQueue; // 获取当前房间的生成队列

        if (!queue || queue.length === 0) return; // 如果队列为空，则直接返回

        const spawns = room.spawn; // 查找所有空闲的 spawn
        if (spawns.length === 0) return; // 如果没有可用的 spawn，则直接返回

        const roomEnergy = room.energyAvailable;
        //const roomEnergyCapacity = room.energyCapacityAvailable;

        //let processedCount = 0; // 记录已处理的任务数量
        const maxSpawnsToUse = Math.min(spawns.length, Math.min(queue.length, QUEUE_CONFIG.MAX_PARALLEL_TASKS)); // 计算最多使用的spawn数量，避免超过队列长度和spawn数量

        //this.cleanupQueue(queue, roomEnergyCapacity);
        // 遍历队列并按顺序分配任务
        //console.log(maxSpawnsToUse);
        for (let i = 0; i < maxSpawnsToUse; i++) {
            const task = queue[i]; // 获取当前任务（队列中的任务按优先级排列）
            const spawn = spawns[i]; // 根据任务的索引选择对应的spawn（0号任务分配给0号spawn，1号任务分配给1号spawn，依此类推）
            if (task.cost > roomEnergy) continue; // 如果任务所需能量大于当前房间可用能量，跳过该任务
            if (spawns.spawning) continue;
            
            if (this.tryAssignTask(spawn, task) ) { // 尝试将任务分配给 spawn
                //console.log(123);
                queue.splice(i, 1); // 如果分配成功，从队列中移除该任务
                //processedCount++; // 增加已处理的任务数量
            }
        }
        this.drawSpawnStatus(room); // 调用可视化绘制方法
    }),

    tryAssignTask: withCpuMonitor('SpawnManager.tryAssignTask', function(spawn, task) {
        const room = spawn.room;
        const role = task.role;
        
        // 获取所有同类型爬虫的workLoc
        const existingCreeps = _.filter(Game.creeps, creep => 
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
        const baseMemory = typeof roleConfig.memory === 'function' 
            ? roleConfig.memory(room) 
            : {};
        

        // 构建合并内存（保留workLoc/home）
        const mergedMemory = {
            ...baseMemory,          // 角色基础配置
            workLoc: workLoc,       // 添加工位号
            home: room.name,        // 记录所属房间
            //role: role              // 确保role字段优先级最高
        };
    
        const name = InsectNameManager.registerName(room);
        const result = spawn.spawnCreep(task.body, name, {
            memory: mergedMemory
        });
    
        if (result === OK) {
            console.log(`[${room.name}] 成功生成 ${task.role}，名称: ${name}，workLoc: ${workLoc}`);
            return true;
        } else {
            console.log(`[${room.name}] 生成失败 ${result}，角色：${role}`);
            return false;
        }
    }),

    // shouldSpawn: withCpuMonitor('SpawnManager.shouldSpawn', function(room, role) {
    //     const existing = room.find(FIND_MY_CREEPS, {
    //         filter: c => c.memory.role === role &&
    //                     c.ticksToLive < 150
    //     }).length;

    //     // 使用ROLE_CONFIGS中定义的limit
    //     const config = ROLE_CONFIGS[role];
    //     const currentLimit = typeof config.limit === 'function' ? config.limit(room) : config.limit;
    //     //console.log(currentLimit);
        
    //     return existing < currentLimit;
    // }),

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

        for (const spawn of spawns) {
            if (spawn.spawning) {
                // 生成中的状态
                const creep = Game.creeps[spawn.spawning.name];
                const role = creep.memory.role;
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
    return body.reduce((sum, part) => sum + BODYPART_COST[part], 0);
}

