var rolepower_B = {

    // 主运行函数
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        creep.notifyWhenAttacked(false);
        const enemiesInRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        const bro = Game.getObjectById(creep.memory.bro);

        // 初始化准备状态
        creep.memory.prepare = creep.memory.prepare || false;

        if (creep.memory.prepare === false) {
            if (!this.prepare(creep, tasksList)) return;  // 准备阶段
        } else {
            const targetPowerBank = creep.room[creep.memory.targetPowerBank];
            if (targetPowerBank && bro) {
                this.toggleState(creep, enemiesInRange);
                if (creep.memory.state === 'harvesting') {
                    this.source(creep, targetPowerBank);  // 采集能量
                } else if (creep.memory.state === 'defensive') {
                    this.work(creep);  // 防守
                }
            } else if (!bro) {
                creep.suicide();  // 如果找不到兄弟creep，直接自杀
            }
        }
    },

    // 切换状态：采集或防守
    toggleState: function(creep, enemiesInRange) {
        creep.memory.state = enemiesInRange.length > 0 ? 'defensive' : 'harvesting';
    },

    // 准备阶段
    prepare: function(creep, tasksList) {
        creep.memory.dontPullMe = false;
        
        // 初始化未设置的属性
        if (creep.memory.unit === undefined) {
            creep.memory.unit = false;
        }
        if (creep.memory.bro === undefined) {
            creep.memory.bro = null;
        }

        // 如果creep正在生成中，跳过准备阶段
        if (Game.creeps[creep.name].spawning) {
            return;
        }

        // 如果有兄弟creep，设置为单位
        if (creep.memory.bro) {
            creep.memory.unit = true;
        } else {
            const spawns = creep.room.spawn;
            const targetSpawn = spawns[2]; 
            if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                // 如果creep不在spawn范围内，则移动到spawn
                creep.moveTo(targetSpawn, { visualizePathStyle: { stroke: '#00ff00' } });
            }
        }

        // 寻找兄弟creep并进入工作状态
        if (creep.memory.unit === false && creep.memory.bro === null) {
            creep.memory.bro = this.findBro(creep);
        } else {
            this.handleBroStatus(creep, tasksList);
        }

        return true;
    },

    // 处理兄弟creep状态，进入工作阶段
    handleBroStatus: function(creep, tasksList) {
        const bro = Game.getObjectById(creep.memory.bro);
        if (bro) {
            if (bro.memory.bro === null) {
                bro.memory.bro = creep.id;
            }
        }
        if (creep.room.name !== creep.memory.sourceRoomName) {
            this.move(creep);
        } else {
            this.move(creep);
            const task = tasksList.find(task => task.type === 'Power' && task.room === creep.memory.sourceRoomName);
            if (task) {
                const targetPowerBank = Game.getObjectById(task.id);
                if (creep.memory.targetPowerBank === undefined) {
                    if (targetPowerBank) {
                        creep.memory.targetPowerBank = task.id;
                    } else {
                        creep.suicide();
                    }
                } else {
                    creep.memory.prepare = true;
                }
            } else {
                creep.suicide();
            }
        }
    },

    // 移动到目标位置
    move: function(creep) {
        creep.memory.dontPullMe = false;
        const bro = Game.getObjectById(creep.memory.bro);
        if (bro && bro.fatigue === 0) {
            creep.moveTo(bro);  // 移动到兄弟creep
        }
    },

    // 查找兄弟creep
    findBro: function(creep) {
        const bros = creep.room.find(FIND_MY_CREEPS).filter(brotherCreep => {
            return brotherCreep.memory.role === 'power_A' &&
                    brotherCreep.memory.unit === false &&
                    brotherCreep.memory.sourceRoomName === creep.memory.sourceRoomName &&
                    brotherCreep.memory.workLoc === creep.memory.workLoc &&
                    brotherCreep.id !== creep.id;
        });
        return bros.length > 0 ? bros[0].id : null;
    },

    // 采集能量阶段
    source: function(creep, targetPowerBank) {
        creep.memory.dontPullMe = false;
        const bro = Game.getObjectById(creep.memory.bro);
        
        this.healIfNeeded(creep, bro);
        
        if (!creep.pos.inRangeTo(targetPowerBank, 2)) {
            this.move(creep);
        }

        return true;
    },

    // 工作阶段
    work: function(creep) {
        creep.memory.dontPullMe = true;
        const bro = Game.getObjectById(creep.memory.bro);
        
        this.healIfNeeded(creep, bro);
        
        return true;
    },

    // 治疗自己或兄弟creep的函数
    healIfNeeded: function(creep, bro) {
        const creepMaxHits = creep.hitsMax;
        const creepHits = creep.hits;

        // 如果生命值低于最大值，尝试治疗自己
        if (creepHits < creepMaxHits) {
            creep.heal(creep);
        } else if (bro) {
            // 如果兄弟creep存在，优先治疗兄弟
            const healResult = creep.heal(bro);
            if (healResult === ERR_NOT_IN_RANGE) {
                creep.moveTo(bro.pos, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};

export default rolepower_B;
