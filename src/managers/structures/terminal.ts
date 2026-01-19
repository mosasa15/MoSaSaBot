const TerminalManager = {
    /**
     * 监控并处理房间的资源需求
     * @param {string} roomName - 房间名称
     */
    run(roomName) {
        const room = Game.rooms[roomName];
        const terminal = room.terminal;
        const storage = room.storage;
        if (!terminal || !storage) return;

        // 处理多房间资源平衡任务
        this.handleInterRoomTasks(roomName);

        // 本房间内资源平衡
        this.balanceResources(roomName);
    },

    /**
     * 本房间内资源平衡
     * @param {string} roomName - 房间名称
     */
    balanceResources(roomName) {
        const room = Game.rooms[roomName];
        const tasksList = Memory.rooms[roomName].tasks || [];
        const terminal = room.terminal;
        const storage = room.storage;
        if (!terminal || !storage) return;

        const thresholds = {
            // 基础资源
            energy: 50000,  // 终端需要保持的能量存储量
            X: 50000,
            L: 50000,
            H: 50000,
            Z: 50000,
            U: 50000,
            K: 50000,
            O: 50000,
            OH: 50000,
            power: 50000,
            cell: 50000,
        
            // 一级化合物
            UH: 3000,
            UO: 3000,
            KH: 3000,
            KO: 3000,
            LH: 3000,
            LO: 3000,
            ZH: 3000,
            ZO: 3000,
            GH: 3000,
            GO: 3000,
        
            ZK: 3000,
            UL: 3000,
            G: 5000,
        
            // 二级化合物
            UH2O: 3000,
            UHO2: 3000,
            KH2O: 3000,
            KHO2: 3000,
            LH2O: 3000,
            LHO2: 3000,
            ZH2O: 3000,
            ZHO2: 3000,
            GH2O: 3000,
            GHO2: 3000,
        
            // 三级化合物
            XUH2O: 3000,
            XUHO2: 3000,
            XKH2O: 3000,
            XKHO2: 3000,
            XLH2O: 50000,
            XLHO2: 3000,
            XZH2O: 3000,
            XZHO2: 3000,
            XGH2O: 3000,
            XGHO2: 3000,
        
            // 默认值
            default: 0,
        };
        

        const activeTaskResources = new Set(
            tasksList.filter(task => task.type === 'share').map(task => task.details.resourceType)
        );

        for (const resourceType of new Set([...Object.keys(terminal.store), ...Object.keys(storage.store)])) {
            if (activeTaskResources.has(resourceType)) continue; // 跳过多房间任务锁定的资源

            const terminalAmount = terminal.store[resourceType] || 0;
            const storageAmount = storage.store[resourceType] || 0;
            const targetAmount = thresholds[resourceType] || thresholds.default;

            if (terminalAmount < targetAmount) {
                const transferAmount = Math.min(targetAmount - terminalAmount, storageAmount);
                if (transferAmount > 0) {
                    // console.log(`[资源平衡] 房间 ${roomName} 从Storage转移 ${transferAmount} ${resourceType} 到Terminal`);
                    this.addTransferTask(storage.id, terminal.id, resourceType, transferAmount, tasksList);
                }
            } else if (terminalAmount > targetAmount) {
                const transferAmount = terminalAmount - targetAmount;
                if (transferAmount > 0) {
                    // console.log(`[资源平衡] 房间 ${roomName} 从Terminal转移 ${transferAmount} ${resourceType} 到Storage`);
                    this.addTransferTask(terminal.id, storage.id, resourceType, transferAmount, tasksList);
                }
            }
        }
    },

    addTransferTask(from, to, resourceType, amount, tasksList) {  //单房间资源平衡任务
        // console.log(`[任务管理] 添加转移任务: 从 ${from} 到 ${to} 资源 ${resourceType} 数量 ${amount}`);
        const isTaskExists = tasksList.some(task =>
            task.type === 'S-T' &&
            task.details.from === from &&
            task.details.to === to &&
            task.details.resourceType === resourceType
        );
        if (!isTaskExists) {
            tasksList.push({
                type: 'S-T',
                Id: generateUUID(),
                details: {
                    from,
                    to,
                    resourceType,
                    amount
                }
            });
            // console.log(`[任务管理] 已成功添加转移任务: 从 ${from} 到 ${to}，资源 ${resourceType} 数量 ${amount}`);
        } else {
            // console.log(`[任务管理] 转移任务已存在，未重复添加`);
        }
    },

        /**
         * 动态生成资源规则
         * @param {string} roomName - 房间名称
         * 该模块：作用于
         */

        defineRules(roomName) {
            const room = Game.rooms[roomName];
            const terminal = room.terminal;
            const storage = room.storage;

            // 初始化 Memory.resourceSources 如果不存在
            if (!Memory.resourceSources) {
                Memory.resourceSources = {
                    // 示例：资源类型作为键，值为提供该资源的房间数组
                    // RESOURCE_HYDROGEN: [ 'W1N2', 'W3N4' ],
                    // RESOURCE_KEANIUM: [ 'W5N6', 'W2N6' ],
                };
            }

            if (!terminal || !storage) return;

            const resourceRules = [];  //动态更新，每次生成前进行初始化

            const resources = new Set([
                ...Object.keys(terminal.store),
                ...Object.keys(storage.store),
            ]);

            const thresholds = {
                // 基础资源
                energy: { critical: 50000, surplus: 500000 },
                X: { critical: 3000, surplus: 30000 },
                L: { critical: 3000, surplus: 30000 },
                H: { critical: 3000, surplus: 30000 },
                Z: { critical: 3000, surplus: 30000 },
                U: { critical: 3000, surplus: 30000 },
                K: { critical: 3000, surplus: 30000 },
                O: { critical: 3000, surplus: 30000 },
                power: { critical: 3000, surplus: 3000 },

                // 一级化合物
                UH: { critical: 3000, surplus: 30000 },
                UO: { critical: 3000, surplus: 30000 },
                KH: { critical: 3000, surplus: 30000 },
                KO: { critical: 3000, surplus: 30000 },
                LH: { critical: 3000, surplus: 30000 },
                LO: { critical: 3000, surplus: 30000 },
                ZH: { critical: 3000, surplus: 30000 },
                ZO: { critical: 3000, surplus: 30000 },
                GH: { critical: 3000, surplus: 30000 },
                GO: { critical: 3000, surplus: 30000 },

                ZK: { critical: 3000, surplus: 30000 },
                UL: { critical: 3000, surplus: 30000 },
                G:  { critical: 5000, surplus: 30000 },

                // 二级化合物
                UH2O: { critical: 3000, surplus: 30000 },
                UHO2: { critical: 3000, surplus: 30000 },
                KH2O: { critical: 3000, surplus: 30000 },
                KHO2: { critical: 3000, surplus: 30000 },
                LH2O: { critical: 3000, surplus: 30000 },
                LHO2: { critical: 3000, surplus: 30000 },
                ZH2O: { critical: 3000, surplus: 30000 },
                ZHO2: { critical: 3000, surplus: 30000 },
                GH2O: { critical: 3000, surplus: 30000 },
                GHO2: { critical: 3000, surplus: 30000 },

                // 三级化合物
                XUH2O: { critical: 3000, surplus: 30000 },
                XUHO2: { critical: 3000, surplus: 30000 },
                XKH2O: { critical: 3000, surplus: 30000 },
                XKHO2: { critical: 3000, surplus: 30000 },
                XLH2O: { critical: 3000, surplus: 30000 },
                XLHO2: { critical: 3000, surplus: 30000 },
                XZH2O: { critical: 3000, surplus: 30000 },
                XZHO2: { critical: 3000, surplus: 30000 },
                XGH2O: { critical: 3000, surplus: 30000 },
                XGHO2: { critical: 3000, surplus: 30000 },

                // 默认值
                default: { critical: 0, surplus: 0 },
            };

            for (const resourceType of resources) {
                const totalAmount = (terminal.store[resourceType] || 0) + (storage.store[resourceType] || 0);
                const { critical, surplus } = thresholds[resourceType] || thresholds.default;

                // 资源不足规则
                if (critical && totalAmount < critical) {
                    resourceRules.push({
                        type: resourceType,
                        amount: surplus,
                        mod: 'get',
                        channel: 'share',
                    });
                }

                // 资源过剩规则
                if (surplus && totalAmount > surplus) {
                    resourceRules.push({
                        type: resourceType,
                        amount: critical,
                        mod: 'put',
                        channel: 'share',
                    });

                    // 将房间添加到共享资源源
                    if (!Memory.resourceSources[resourceType]) {
                        Memory.resourceSources[resourceType] = [];
                    }
                    if (!Memory.resourceSources[resourceType].includes(roomName)) {
                        Memory.resourceSources[resourceType].push(roomName);
                    }
                } else {
                    // 如果资源低于 surplus，将房间从共享资源源中移除
                    if (Memory.resourceSources[resourceType]) {
                        const index = Memory.resourceSources[resourceType].indexOf(roomName);
                        if (index !== -1) {
                            Memory.resourceSources[resourceType].splice(index, 1);
                        }
                    }
                }
            }

            if (!Memory.rooms[roomName]) Memory.rooms[roomName] = {};
            Memory.rooms[roomName].resourceRules = resourceRules;

            //console.log(`[资源规则] 房间 ${roomName} 的规则已更新:`, JSON.stringify(resourceRules));
        },


    /**
     * 处理多房间资源平衡任务
     * @param {string} roomName - 房间名称
     */
    handleInterRoomTasks(roomName) {
        //console.log('123')
        const room = Game.rooms[roomName];
        const terminal = room.terminal;
        const storage = room.storage;
        const tasksList = Memory.rooms[roomName].tasks || [];
        if (!terminal || !storage) return;

        // 动态生成资源规则
        this.defineRules(roomName);

        const resourceRules = Memory.rooms[roomName].resourceRules || [];
        const resourceSources = Memory.resourceSources || {};

        // 遍历资源规则，逐条检查和处理
        for (const rule of resourceRules) {
            const { type, amount, mod, channel } = rule;
            const currentAmount = (terminal.store[type] || 0) + (storage.store[type] || 0);
            if (mod === 'get' && currentAmount < amount) {  //获取 amount -currentAmount是缺少的数量
                this.handleDeficit(type, amount - currentAmount , channel, roomName, resourceSources);
            } 
            // else if (mod === 'put' && currentAmount > amount) { //提供
            //     this.handleSurplus(type, currentAmount - amount, channel, roomName, resourceSources);
            // }
        }
    },


    // addInterRoomTask(resourceType, amount, targetRoom, tasksList) { //多房间资源平衡任务  // share  暂时禁止使用
    //     /**
    //      * 以房间为单位作为基础单元，每个房间具备检测本房间资源的能力，同时遍历
    //      */
    //     console.log(`[任务管理] 添加多房间任务: 将 ${amount} ${resourceType} 发送到房间 ${targetRoom}`);
    //     const isTaskExists = tasksList.some(task =>
    //         task.type === 'inter-room' &&
    //         task.details.resourceType === resourceType &&
    //         task.details.amount === amount &&
    //         task.details.targetRoom === targetRoom
    //     );

    //     if (!isTaskExists) {
    //         tasksList.push({
    //             type: 'inter-room',
    //             Id: generateUUID(),
    //             details: {
    //                 resourceType,
    //                 amount,
    //                 targetRoom
    //             }
    //         });
    //         console.log(`[任务管理] 已成功添加多房间任务`);
    //     } else {
    //         console.log(`[任务管理] 多房间任务已存在，未重复添加`);
    //     }
    // },

    /**
     * 处理资源短缺逻辑
     */
    handleDeficit(resourceType, deficit, channel, roomName, resourceSources) {
        switch (channel) {
            case 'share': {
                const response = this.shareRequest(resourceType, deficit, roomName, resourceSources);
                if (response) {
                    // console.log(`[资源管理] 房间 ${roomName} 获取到共享资源 ${deficit} ${resourceType}`);
                } else {
                    // console.log(`[资源管理] 房间 ${roomName} 未能获取到共享资源 ${deficit} ${resourceType}`);
                }
                break;
            }
            default:
                // console.log(`[资源管理] 未知物流渠道: ${channel}`);
        }
    },

    /**
     * 尝试向能提供资源的房间派发共享任务
     * @param {string} resourceType 资源种类
     * @param {number} deficit 所需资源数量
     * @param {string} requestingRoom 请求资源的房间
     * @param {object} resourceSources 可提供资源的房间列表
     */
    shareRequest(resourceType, deficit, requestingRoom, resourceSources) {
        if (!resourceSources[resourceType]) return false;

        const candidates = [];

        // 筛选出所有能提供资源的房间
        for (const roomName of resourceSources[resourceType]) {
            if (roomName === requestingRoom) continue;

            const room = Game.rooms[roomName];
            const roomTerminal = room.terminal;
            const roomStorage = room.storage;
            if (!roomTerminal) continue;
            if (!roomStorage) continue;

            const availableAmount = roomTerminal.store[resourceType] + roomStorage.store[resourceType] || 0;
            if (availableAmount < 40000) continue; // 忽略无效房间或资源量太少的房间

            const transferableAmount = Math.min(deficit, 100000); // 限制单次发送量最大为 100K 
            const cost = Game.market.calcTransactionCost(transferableAmount, roomName, requestingRoom); // 路费计算//此次求的是，100K或者全部的路费； 
            candidates.push({ roomName, availableAmount, transferableAmount, cost });//提供资源的房间，该房间内可用资源，
        }

        if (candidates.length === 0) {
            // console.log(`[资源共享] 无法找到满足条件的房间提供 ${deficit} ${resourceType}`);
            return false;
        }

        // 根据资源量优先排序，如果资源量差距小于等于 10K，则按路费排序
        candidates.sort((a, b) => {
            const amountDiff = b.availableAmount - a.availableAmount;
            if (amountDiff > 10000) return amountDiff; // 优先资源量多的房间
            return a.cost - b.cost; // 如果差距小于等于 10K，则选择路费低的房间
        });

        // 选择最优房间
        const bestCandidate = candidates[0];

        // console.log(`[资源共享] 房间 ${bestCandidate.roomName} 提供 ${bestCandidate.transferableAmount} ${resourceType} 资源给房间 ${requestingRoom}`);
        const task = {
            type: 'share',//分享
            Id: generateUUID(),
            details: {
                mod: 'put',//提供
                room: requestingRoom,
                number: bestCandidate.transferableAmount,
                resourceType: resourceType,
                cost: bestCandidate.cost, // 添加路费信息到任务
            },
        };

        const tasksList = Memory.rooms[bestCandidate.roomName].tasks || (Memory.rooms[bestCandidate.roomName].tasks = []);
        const isTaskExists = tasksList.some(existingTask =>
            existingTask.type === 'share' &&
            existingTask.details.room === requestingRoom &&
            existingTask.details.resourceType === resourceType 
            //existingTask.details.number === bestCandidate.transferableAmount
        );

        if (!isTaskExists) {
            tasksList.push(task);
            // console.log(`[资源共享] 已为房间 ${bestCandidate.roomName} 创建资源共享任务`);
            return true;
        } else {
            // console.log(`[资源共享] 房间 ${bestCandidate.roomName} 已经有相同的共享任务，不再重复添加`);
            return false;
        }
    },


    /**
     * 处理资源过剩逻辑
     */
    handleSurplus(resourceType, surplus, channel, roomName, resourceSources) {
        if (!resourceSources[resourceType]) {
            resourceSources[resourceType] = [];
        }
        if (!resourceSources[resourceType].includes(roomName)) {
            resourceSources[resourceType].push(roomName);
        }
        switch (channel) {
            // case 'take': {
            //     console.log(`[资源管理] 房间 ${roomName} 向市场出售 ${surplus} ${resourceType}`);
            //     break;
            // }
            case 'share': {
                // console.log(`[资源管理] 房间 ${roomName} 提供共享 ${surplus} ${resourceType}`);
                break;
            }
            // case 'release': {
            //     console.log(`[资源管理] 房间 ${roomName} 挂单出售 ${surplus} ${resourceType}`);
            //     break;
            // }
            default:
                // console.log(`[资源管理] 未知物流渠道: ${channel}`);
        }
    },
};

function generateUUID() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

export default TerminalManager;
