var rolepower_A = {
    // 主运行函数
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        creep.notifyWhenAttacked(false);
        const enemiesInRange = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);

        // 初始化状态
        creep.memory.prepare = creep.memory.prepare || false;

        if (!creep.memory.prepare) {
            if (!this.prepare(creep, tasksList)) return; // 准备阶段
        } else {
            const targetPowerBank = creep.room[creep.memory.targetPowerBank];
            if (targetPowerBank) {
                this.toggleState(creep, enemiesInRange);  
                if (creep.memory.state === 'harvesting') {
                    this.source(creep, targetPowerBank, tasksList); // 采集能量
                } else if (creep.memory.state === 'defensive') {
                    this.work(creep, enemiesInRange); // 防守工作
                }
            } else {
                this.handleNoPowerBank(creep, tasksList);
            }
        }
    },

    // 处理没有PowerBank的情况
    handleNoPowerBank: function(creep, tasksList) {
        const task = tasksList.find(task => (task.type === 'Power' || task.type === 'Powertransfer') && task.room === creep.room.name);
        if (task) {
            const index = tasksList.indexOf(task);
            Memory.rooms[creep.memory.targetRoomName].tasks.splice(index, 1);
        } else {
            creep.suicide();  // 如果没有相关任务，消亡
        }
    },

    // 切换工作状态
    toggleState: function(creep, enemiesInRange) {
        creep.memory.state = (enemiesInRange.length > 0) ? 'defensive' : 'harvesting';
    },

    // 准备阶段
    prepare: function(creep, tasksList) {
        creep.memory.dontPullMe = true;

        if (Game.creeps[creep.name].spawning) return;

        if (!creep.memory.bro) {
            creep.memory.bro = this.findBro(creep);
        } else {
            creep.memory.unit = true;
        }

        const targetSpawn = creep.room.spawn[2];
        if (!creep.memory.unit && targetSpawn) {
            if (targetSpawn.renewCreep(creep) === ERR_NOT_IN_RANGE) {
                creep.moveTo(targetSpawn, { visualizePathStyle: { stroke: '#00ff00' } });
            }
            return;
        }


        // console.log(creep.memory.bro)
        if ( creep.memory.bro ) {
            const bro = Game.getObjectById(creep.memory.bro);
            if( bro ){
                if(bro.memory.bro === null){
                    bro.memory.bro = creep.id;
                }
            }
        } 

        if (creep.room.name !== creep.memory.sourceRoomName) {
            this.moveToSourceRoom(creep);
            return;
        }

        const task = tasksList.find(task => task.type === 'Power' && task.room === creep.memory.sourceRoomName);
        if (task) {
            const targetPowerBank = Game.getObjectById(task.id);
            if (!creep.memory.targetPowerBank) {
                creep.memory.targetPowerBank = task.id;
            }
            if (targetPowerBank && creep.memory.targetPowerBank) {
                creep.memory.prepare = true;
            } else {
                this.handleNoPowerBank(creep, tasksList);
            }
        } else {
            this.handleNoPowerBank(creep, tasksList);
        }

        return true;
    },

    // 找到兄弟 creep
    findBro: function(creep) {
        const bros = creep.room.find(FIND_MY_CREEPS).filter(brotherCreep =>
            brotherCreep.memory.role === 'power_B' &&
            brotherCreep.memory.unit === false &&
            brotherCreep.memory.sourceRoomName === creep.memory.sourceRoomName &&
            brotherCreep.memory.workLoc === creep.memory.workLoc &&
            brotherCreep.id !== creep.id
        );

        return bros.length > 0 ? bros[0].id : null;
    },

    // 移动到源房间
    moveToSourceRoom: function(creep) {
        if (creep.room.name === creep.memory.targetRoomName) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.sourceRoomName), { visualizePathStyle: { stroke: '#ffaa55' } });
        } else {
            this.Move(creep, new RoomPosition(25, 25, creep.memory.sourceRoomName));
        }
    },

    // source阶段
    source: function(creep, targetPowerBank, tasksList) {
        creep.memory.dontPullMe = true;
        const flag = Game.flags['Flag1'];
        
        if (flag) {
            if (creep.pos.getRangeTo(flag) !== 0) {
                creep.moveTo(flag, { visualizePathStyle: { stroke: '#ff0000' } });
            }
        } else {
            this.attackOrHarvest(creep, targetPowerBank, tasksList);
        }
        return true;
    },

    // 攻击或者采集
    attackOrHarvest: function(creep, targetPowerBank, tasksList) {
        if (targetPowerBank && targetPowerBank.power > 0) {
            const carryCapacity = 1250;
            const number = Math.ceil(targetPowerBank.power / carryCapacity);
            if ( true ) {
                const attackResult = creep.attack(targetPowerBank);
                if (attackResult === ERR_NOT_IN_RANGE) {
                    this.Move(creep, targetPowerBank);
                }
                if (attackResult === OK && targetPowerBank.hits < 600000) {
                    if (!tasksList.some(task => task.type === 'Powertransfer' && task.number === number && task.room === creep.room.name)) {
                        tasksList.push({
                            type: 'Powertransfer',
                            number: number,
                            room: creep.room.name
                        });
                    }
                }
            }
        }
    },

    // 移动函数
    Move: function(creep, target) {
        const bro = Game.getObjectById(creep.memory.bro);
        if (!bro || bro.fatigue > 0) return;

        const distanceToBro = creep.pos.getRangeTo(bro.pos);
        const isOnEdge = creep.pos.x === 0 || creep.pos.x === 49 || creep.pos.y === 0 || creep.pos.y === 49;
        if (!isOnEdge && distanceToBro > 1) {
            creep.say('等');
        } else {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
        }
    },

    // 工作阶段
    work: function(creep, enemiesInRange) {
        creep.memory.dontPullMe = true;
        const attackers = enemiesInRange.filter(enemy => enemy.body.some(part => part.type === ATTACK));
        const healers = enemiesInRange.filter(enemy => enemy.body.some(part => part.type === HEAL));
        const carrys = enemiesInRange.filter(enemy => enemy.body.some(part => part.type === CARRY));

        if (creep.hits === creep.hitsMax) {
            this.attackEnemies(creep, healers, attackers, carrys);
        }
        return true;
    },

    // 攻击敌人
    attackEnemies: function(creep, healers, attackers, carrys) {
        let target;
        if (healers.length > 0) {
            target = this.findClosestTarget(creep, healers);
        } else if (attackers.length > 0) {
            target = this.findClosestTarget(creep, attackers);
        } else {
            target = this.findClosestTarget(creep, carrys);
        }
        const attackResult = creep.attack(target);
        if (attackResult === ERR_NOT_IN_RANGE) {
            this.Move(creep, target);
        }
    },

    // 找到最近的目标
    findClosestTarget: function(creep, targets) {
        return targets.reduce((closest, target) =>
            creep.pos.getRangeTo(target) < creep.pos.getRangeTo(closest) ? target : closest
        );
    }
};

export default rolepower_A;
