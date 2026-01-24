var rolereserveController = {  
    /**  
     * @param {Creep} creep 
     */  
    run: function(creep) {  
        var sourceRoomName = creep.memory.sourceRoomName;  
        // 如果当前不在源房间，则移动到源房间  
        if (creep.room.name !== sourceRoomName) {  
            creep.moveTo(new RoomPosition(25, 25, sourceRoomName), { visualizePathStyle: { stroke: '#ffaa00' } });  
            return;  
        }  
        // 获取当前房间的控制器  
        var controller = creep.room.controller;  
        // 检查控制器是否存在  
        if (controller) {  
            // 检查控制器是否被预定  
            if (controller.reservation && controller.reservation.username !== creep.owner.username) {  
                // 如果控制器被预定且预定者不是当前creep的主人，则进行攻击  
                if (creep.attackController(controller) == ERR_NOT_IN_RANGE) {  
                    creep.moveTo(controller);  
                }  
            } else {  
                if (creep.reserveController(controller) == ERR_NOT_IN_RANGE) {  
                    creep.moveTo(controller);  
                }  
            }  
        }  
    }  
};  

export default rolereserveController;
