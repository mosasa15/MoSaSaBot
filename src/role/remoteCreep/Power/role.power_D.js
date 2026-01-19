var rolepower_D = {

    // 主运行函数
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        creep.notifyWhenAttacked(false);
        const enemiesInRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 1);

        // 初始化准备状态
        creep.memory.prepare = creep.memory.prepare || false;

        if (creep.memory.prepare === false) {
            if (!this.prepare(creep, tasksList)) return; // 准备阶段
        } else {
            const targetPowerBank = Game.getObjectById(creep.memory.targetPowerBank);
            if (targetPowerBank) {
                this.toggleState(creep, enemiesInRange);
                if (creep.memory.state === 'harvesting') {
                    this.source(creep, targetPowerBank); // 采集能量阶段
                } else if (creep.memory.state === 'defensive') {
                    this.work(creep, enemiesInRange); // 工作阶段
                }
            } else {
                creep.suicide(); // 如果找不到目标，直接自杀
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

        if (Game.creeps[creep.name].spawning) {
            return;
        }

        // 移动到 sourceRoomName
        if (creep.room.name !== creep.memory.sourceRoomName) {
            this.move(creep);
        } else {
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
        return true;
    },

    // 移动到目标位置
    move: function(creep) {
        creep.memory.dontPullMe = false;
        const targetPos = new RoomPosition(25, 25, creep.memory.sourceRoomName); // 中心点，作为目标位置
        creep.moveTo(targetPos, { visualizePathStyle: { stroke: '#00ff00' } });
    },

    // 采集能量阶段
    source: function(creep, targetPowerBank) {
        creep.memory.dontPullMe = true;

        // 对 PowerBank 进行远程攻击
        if (creep.pos.inRangeTo(targetPowerBank, 3)) {
            creep.rangedAttack(targetPowerBank);
        } else {
            creep.moveTo(targetPowerBank, { visualizePathStyle: { stroke: '#ffaa00' } });
        }

        creep.heal(creep);
        return true;
    },

    // 工作阶段
    work: function(creep, enemiesInRange) {
        creep.memory.dontPullMe = true;
        const attackers = enemiesInRange.filter(enemy => enemy.body.some(part => part.type === ATTACK));
        const healers = enemiesInRange.filter(enemy => enemy.body.some(part => part.type === HEAL));
        const carrys = enemiesInRange.filter(enemy => enemy.body.some(part => part.type === CARRY));
        
        if (creep.hits >= creep.hitsMax * 0.5) {
            this.rangedAttackEnemies(creep, healers, attackers, carrys);
        }
        return true;
    },

    // 攻击敌人
    rangedAttackEnemies: function(creep, healers, attackers, carrys) {
        let target;
        if (healers.length > 0) {
            target = this.findClosestTarget(creep, healers);
        } else if (attackers.length > 0) {
            target = this.findClosestTarget(creep, attackers);
        } else {
            target = this.findClosestTarget(creep, carrys);
        }

        if (target) {
            creep.rangedAttack(target);
            
            // if (creep.pos.getRangeTo(target) <= 3) {
            //     // 如果敌人距离小于等于三格，朝反方向移动
            //     const direction = target.getDirectionTo(creep);
            //     creep.move(direction);
            // } else {
            //     // 如果敌人距离大于三格，进行攻击
            //     if (creep.pos.inRangeTo(target, 3)) {
            //     } else {
            //         creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000' } });
            //     }
            // }
        }
    },

    // 找到最近的目标
    findClosestTarget: function(creep, targets) {
        return targets.reduce((closest, target) =>
            creep.pos.getRangeTo(target) < creep.pos.getRangeTo(closest) ? target : closest
        );
    }
};

export default rolepower_D;
