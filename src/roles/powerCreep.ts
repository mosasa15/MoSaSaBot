var powerCreep = {
    /**
     * @param {Creep} creep
     */
    run: function(powerCreep) {
        const storage = powerCreep.room.storage;
        const powerSpawn = powerCreep.room.powerSpawn;
        const spawns = powerCreep.room.spawn;
        const sources = powerCreep.room.source;
        const terminal = powerCreep.room.terminal;
        const flag = Game.flags['P']; // 确保有一个名为 'P' 的旗帜
        if( flag ){
            this.moveToFlag(powerCreep, flag);
        }else {
            this.RenewCreep(powerCreep, powerSpawn);
            this.generateOps(powerCreep, powerCreep.room.controller);
            this.operateStorage(powerCreep, storage);
            //this.operateSpawn(powerCreep, spawns, storage);
            this.transferOps(powerCreep, storage);
            this.operateExtension(powerCreep, storage, terminal);
            this.rengeSource(powerCreep, sources, storage);
            // this.moveToFlag(powerCreep);
        }
    },

    /**
     * 检查并尝试更新 Creep
     * @param {Creep} powerCreep 
     * @param {StructurePowerSpawn} powerSpawn 
     */
    RenewCreep: function(powerCreep, powerSpawn) {
        if (powerCreep.ticksToLive < 3000) {
            powerCreep.memory.renewing = true;
        }
        if (powerCreep.memory.renewing && powerCreep.ticksToLive < 4800) {
            this.renew(powerCreep, powerSpawn);
        } else if (powerCreep.memory.renewing) {
            powerCreep.memory.renewing = false;
        }
    },

    /**
     * 尝试更新 Creep
     * @param {Creep} powerCreep 
     * @param {StructurePowerSpawn} powerSpawn 
     */
    renew: function(powerCreep, powerSpawn) {
        if (powerCreep.renew(powerSpawn) === ERR_NOT_IN_RANGE) {
            powerCreep.moveTo(powerSpawn, {visualizePathStyle: {stroke: '#00ff00'}});
        }
    },

    /**
     * 尝试生成 Ops 并检查控制器是否开启Power
     * @param {Creep} powerCreep 
     * @param {StructureController} controller 
     */
    generateOps: function(powerCreep, controller) {
        if (powerCreep.usePower(PWR_GENERATE_OPS) === ERR_INVALID_ARGS) {
            if (powerCreep.enableRoom(controller) === ERR_NOT_IN_RANGE) {
                powerCreep.moveTo(controller);
            }
        }
    },

    /**
     * 如果 Storage 已满，尝试操作 Storage
     * @param {Creep} powerCreep 
     * @param {StructureStorage} storage 
     */
    operateStorage: function(powerCreep, storage) {
        if (storage.store.getUsedCapacity() >= 1000000) {
            const result = powerCreep.usePower(PWR_OPERATE_STORAGE, storage);
            if (result === ERR_NOT_ENOUGH_RESOURCES) {
                this.withdrawOps(powerCreep, storage);
            } else if (result === ERR_NOT_IN_RANGE) {
                powerCreep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    },

    /**
     * 尝试转移 Ops
     * @param {Creep} powerCreep 
     * @param {StructureStorage} storage 
     */
    transferOps: function(powerCreep, storage) {
        if (powerCreep.store.getFreeCapacity() === 0) {
            if (powerCreep.transfer(storage, RESOURCE_OPS) === ERR_NOT_IN_RANGE) {
                powerCreep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    },

    /**
     * 尝试从 Storage 提取 Ops
     * @param {Creep} powerCreep 
     * @param {StructureStorage} storage 
     */
    withdrawOps: function(powerCreep, storage) {
        if (powerCreep.withdraw(storage, RESOURCE_OPS, 100) === ERR_NOT_IN_RANGE) {
            powerCreep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    },

    /**
     * 尝试操作正在孵化的 Spawn
     * @param {Creep} powerCreep 
     * @param {StructureSpawn[]} spawns 
     * @param {StructureStorage} storage 
     */
    operateSpawn: function(powerCreep, spawns, storage) {
        const Spawn = spawns.find(s => (!s.effects || !s.effects.some(e => e.effect == PWR_OPERATE_SPAWN)));
        if (Spawn) {
            const result = powerCreep.usePower(PWR_OPERATE_SPAWN, Spawn);
            if (result === ERR_NOT_ENOUGH_RESOURCES) {
                this.withdrawOps(powerCreep, storage);
            } else if (result === ERR_NOT_IN_RANGE) {
                powerCreep.moveTo(Spawn, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    },

    /**
     * 尝试操作Extension
     * @param {Creep} powerCreep 
     * @param {StructureSpawn[]} spawns 
     * @param {StructureStorage} storage 
     */
    operateExtension: function(powerCreep, storage, terminal) {
        if (powerCreep.room.energyAvailable < 6000) {
            if (storage) {
                const result = powerCreep.usePower(PWR_OPERATE_EXTENSION, storage);
                if (result === ERR_NOT_ENOUGH_RESOURCES) {
                    this.withdrawOps(powerCreep, storage);
                } else if (result === ERR_NOT_IN_RANGE) {
                    powerCreep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    },

    /**
     * 尝试操作 Source
     * @param {Creep} powerCreep 
     * @param {StructureSpawn[]} spawns 
     * @param {StructureStorage} storage 
     */
    rengeSource: function(powerCreep, sources, storage) {
        const source = sources.find(s => (!s.effects || !s.effects.some(e => e.effect == PWR_REGEN_SOURCE)));
        if (source) {
            const result = powerCreep.usePower(PWR_REGEN_SOURCE, source);
            if (result === ERR_NOT_ENOUGH_RESOURCES) {
                this.withdrawOps(powerCreep, storage);
            } else if (result === ERR_NOT_IN_RANGE) {
                powerCreep.moveTo(source, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    },

    /**
     * 尝试捡起地上的资源
     * @param {Creep} powerCreep 
     */
    pickUp: function(powerCreep, storage) {
        const droppedResources = powerCreep.room.find(FIND_DROPPED_RESOURCES);
        const powerResources = droppedResources.find(resource => resource.resourceType === RESOURCE_POWER);
        if (powerCreep.store[RESOURCE_POWER] === 0) {
            if (powerResources) {
                if (powerCreep.pickup(powerResources) === ERR_NOT_IN_RANGE) {
                    powerCreep.moveTo(powerResources, { visualizePathStyle: { stroke: '#0000ff' } });
                }
            }
        } else {
            const result = powerCreep.transfer(storage, RESOURCE_POWER);
            if (result === ERR_NOT_IN_RANGE) {
                powerCreep.moveTo(storage, {visualizePathStyle: {stroke: '#00ffff'}});
            }
        }
    },

    /**
     * 移动到指定旗帜
     * @param {Creep} powerCreep 
     */
    moveToFlag: function(powerCreep, flag) {
        const targetX = flag.pos.x ;
        const targetY = flag.pos.y ;
        const roomName = flag.pos.roomName;  
        const targetPosition = new RoomPosition(targetX, targetY, roomName);  
        powerCreep.moveTo(targetPosition, {visualizePathStyle: {stroke: '#ffaa00'}});
    },
};

export default powerCreep;
