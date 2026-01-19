var roleAttacker = {
    /**
     * @param {Creep} creep
     */
    run: function(creep) {
        const sourceRoomName = creep.memory.sourceRoomName;
        //const targetRoomName = creep.memory.targetRoomName;
        // let tasksList = Memory.rooms[creep.memory.targetRoomName].tasks;
        creep.memory.dontPullMe = true;  

        // 如果creep不在源房间，则移动到源房间  
        if (creep.room.name !== sourceRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });  
            return;  
        }  
        // 查找并攻击入侵者核心
        var invaderCores = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => structure.structureType === STRUCTURE_INVADER_CORE
        });

        // 查找并攻击带有ATTACK部件的敌对creep
        const hostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS, {
            filter: (creep) => creep.body.some(part => part.type === ATTACK || part.type === RANGED_ATTACK)
        });

        // 如果没有入侵者核心，查找并攻击带有ATTACK部件的敌对creep
        if ( false ) {
            const target = findClosestTarget(creep, hostileCreeps);
            if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        } else {
            if (invaderCores.length > 0) {
                const target = invaderCores[0];
                if (creep.attack(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
            }
        }
    }
};

function findClosestTarget(creep, targets) {  
    let closest = targets[0];  
    let minDistance = creep.pos.getRangeTo(closest);  
    for (let i = 1; i < targets.length; i++) {  
        let distance = creep.pos.getRangeTo(targets[i]);  
        if (distance < minDistance) {  
            closest = targets[i];  
            minDistance = distance;  
        }  
    }  
    return closest;  
}  
export default roleAttacker;

