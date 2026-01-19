var roledefenser = {
    /** @param {Creep} creep **/
    run: function(creep) {
        const tasksList = Memory.rooms[creep.memory.targetRoomName]?.tasks || [];
        if (creep.memory.boosted === undefined) {  
            creep.memory.boosted = false;  
        }  
        
        // Boosting Logic (Simplified & Generic)
        // Only boost if room config says so, or if we want to default to not boosting for now.
        // For generic bots, auto-boosting without configuration is dangerous.
        // Let's check a memory flag: Memory.rooms[roomName].boostDefenders
        const shouldBoost = Memory.rooms[creep.room.name] && Memory.rooms[creep.room.name].boostDefenders;
        
        if( shouldBoost && creep.memory.boosted === false ){
            const labs = creep.room.lab;  
            if (!labs || labs.length < 3) {
                // Not enough labs to boost, skip
                creep.memory.boosted = true;
                return;
            }
            
            // 检查 creep.memory 中是否有 boostIndex，如果没有则初始化为 0  
            if (!creep.memory.boostIndex) {  
                creep.memory.boostIndex = 0;  
            }  
            // 根据 boostIndex 获取对应的实验室和强化类型  
            let boostLab, boostType;  
            // Generic boosting: Lab 2 = MOVE, Lab 1 = ATTACK, Lab 0 = HEAL (Just as an example from original code)
            // Ideally this should be configured in Memory too.
            switch (creep.memory.boostIndex) {  
                case 0:  
                    boostLab = labs[2];  
                    boostType = MOVE;  
                    break; 
                case 1:  
                    boostLab = labs[1];  
                    boostType = ATTACK;  
                    break;  
                default:  
                    // 如果 boostIndex 超出范围，重置为 0  
                    creep.memory.boostIndex = 0;  
                    boostLab = labs[0];  
                    boostType = HEAL;  
            }  
            
            if (boostLab) {
                // 执行 boostCreep 操作  
                const result = boostLab.boostCreep(creep, boostType);  
                if (result === OK) {  
                    // 如果当前是最后一次强化，设置 boosted 为 true  
                    if (creep.memory.boostIndex === 1) {  
                        creep.memory.boosted = true;  
                    } else {  
                        // 否则，增加 boostIndex 以准备下一次强化  
                        creep.memory.boostIndex++;  
                    }  
                } else if (result === ERR_NOT_IN_RANGE) {  
                    // 如果不在范围内，移动到对应的实验室  
                    creep.moveTo(boostLab, { visualizePathStyle: { stroke: '#0000ff' } });  
                } else {  
                    // 处理其他可能的错误情况（可选）  
                    // console.log(`Boost failed with error: ${result}`);
                    // If boost fails (e.g. no mineral), skip
                    creep.memory.boosted = true;
                }
            } else {
                 creep.memory.boosted = true;
            }
        } else {
            // Combat Logic
            this.runCombat(creep);
        }
    },
    
    runCombat: function(creep) {
         if( true ) {
            const roomName = creep.room.name;
            // 查找当前房间的所有 rampart
            const ramparts = creep.room.rampart || []; // Ensure array
            // 如果没有 rampart，则直接返回或执行其他逻辑
            
            // 查找当前房间的所有敌对 creep
            const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
            
            if (hostileCreeps.length > 0) {
                // Engage Hostiles
                
                 // 初始化最近的 rampart 和其距离
                let closestRampart = null;
                let minDistance = Infinity;
                
                // 遍历每个 rampart，找到距离敌人最近的 rampart
                if (ramparts.length > 0) {
                    for (const rampart of ramparts) {
                        let minEnemyDistance = Infinity;
                        const distance = rampart.pos.getRangeTo(hostileCreeps[0].pos);
                        if (distance < minEnemyDistance) {
                            minEnemyDistance = distance;
                        }
                        const totalDistance = minEnemyDistance;
                        if (totalDistance < minDistance) {
                            minDistance = totalDistance;
                            closestRampart = rampart;
                        }
                    }
                }
                
                // 如果有找到最近的 rampart，则前往该位置
                if (closestRampart) {
                    creep.moveTo(closestRampart.pos, { visualizePathStyle: { stroke: '#ff0000' } });
                }
                
                const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if(target) {
                    // creep.attack(target)
                        // 检查 creep 是否携带 ATTACK 部件
                    const hasAttackPart = creep.body.some(part => part.type === ATTACK);
                    // 检查 creep 是否携带 RANGED_ATTACK 部件
                    const hasRangedAttackPart = creep.body.some(part => part.type === RANGED_ATTACK);
                
                    // 根据携带的部件类型进行攻击
                    if (hasAttackPart && !hasRangedAttackPart || // 如果有 ATTACK 且没有 RANGED_ATTACK
                        (hasAttackPart && hasRangedAttackPart && creep.pos.getRangeTo(target) <= 3)) { // 或者两者都有但距离足够近以进行近战
                        creep.attack(target);
                    } else if (hasRangedAttackPart) { // 如果有 RANGED_ATTACK
                        creep.rangedAttack(target);
                    }
                }
            }
            
            // Flag Logic (Patrol / Remote Defense)
            if(creep.memory.flagName){
                const flag = Game.flags[creep.memory.flagName];
                if(flag && (creep.ticksToLive < 10 || creep.hits < 200)){
                    flag.remove();
                }
            }
            
            if(!creep.memory.flagName){
                // Only create flag if needed? Or remove this "Random Flag" logic which seems to be testing code?
                // The original code created random flags to move to? 
                // "const flagName = generateRandomFlagName();"
                // This seems like a patrol mechanism.
                // For now, I will keep it but safeguard it.
                // Actually, random flags clutter the game. I'll comment it out unless it's critical.
                /*
                const flagName = generateRandomFlagName();
                const room = Game.rooms[creep.room.name];
                const flagPosition = new RoomPosition(25, 25, room.name);
                Game.flags[flagName] = flagPosition;
                creep.memory.flagName = flagName;
                room.createFlag( flagPosition.x, flagPosition.y, flagName );
                */
            } 
            
            const flag = Game.flags[creep.memory.flagName];
            if ( flag ) {
                const roomName = flag.pos.roomName;  
                const position = this.getPositionInMatrix(creep.memory.workLoc || 0);
                const targetX = Math.min(49, Math.max(0, flag.pos.x + position.x));
                const targetY = Math.min(49, Math.max(0, flag.pos.y + position.y));
                const targetPosition = new RoomPosition(targetX, targetY, roomName);  
                
                if (creep.pos.x === flag.pos.x && creep.pos.y === flag.pos.y) {
                    const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                    if(target) {
                        const hasAttackPart = creep.body.some(part => part.type === ATTACK);
                        const hasRangedAttackPart = creep.body.some(part => part.type === RANGED_ATTACK);
                        if (hasAttackPart && !hasRangedAttackPart || 
                            (hasAttackPart && hasRangedAttackPart && creep.pos.getRangeTo(target) <= 3)) { 
                            creep.attack(target);
                        } else if (hasRangedAttackPart) { 
                            creep.rangedAttack(target);
                        }
                    }
                }
                creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ff0000' } });  
            }
        } 
    },
    
    // 获取creep在方阵中的位置
    getPositionInMatrix: function(workLoc) {
        // 假设方阵的每个单位距离为1
        const positions = [
            { x: 0, y: 0 }, // workLoc 0
            { x: 0, y: 1 },  // workLoc 1
            { x: 1, y: 0 },  // workLoc 2
            { x: 1, y: 1 }   // workLoc 3
        ];
        return positions[workLoc] || positions[0];
    },
}

function generateRandomFlagName() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 5; i++) { // 生成一个10字符长的随机字符串
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export default roledefenser;
