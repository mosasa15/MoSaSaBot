var Tower = {  
    whitelist: ['ZaindORp','NODS','Avarice','NoName_','Kaoruko','Komeiji_Koishi'], 
    blacklist: ['Avarice', 'denisc'],
    /**  
     * @param {StructureTower} tower - 当前的塔对象  
     */  
    run: function( roomName ) {  
        let room = Game.rooms[roomName];    
        if(!room){
            return;
        }
        const towers = room.tower;
        var roomMemory = Memory.rooms[roomName];
        
        // 首先检查 roomMemory 和 tasks 数组是否存在  
        if (!roomMemory || !roomMemory.tasks) {  
            // 如果 roomMemory 不存在，则初始化它  
            if (!roomMemory) {  
                Memory.rooms[roomName] = {};  
                roomMemory = Memory.rooms[roomName];  
            }  
            // 如果 tasks 数组不存在，则初始化它  
            if (!roomMemory.tasks) {  
                roomMemory.tasks = [];  
            }  
        }  
        const tasksList = Memory.rooms[roomName].tasks;
        if((Game.time % 1 === 0)){
            for(let tower of towers){
                if ( !tasksList.some(task => task.type === 'fillTower') && tower.store.energy < 600) {  
                    this.pushFillTowerTask(tower, tasksList); 
                    return;
                }
                if(Game.time % 1 === 0 ){

                    var targets = tower.room.find(FIND_HOSTILE_CREEPS);
                    // 按距离排序，但不使用findClosestByPath
                    targets.sort((a, b) => a.pos.getRangeTo(tower) - b.pos.getRangeTo(tower));
                    if ( targets.length > 0 ) {
                        // 获取要攻击的目标索引
                        for (var i = 0; i < towers.length; i++) {  
                            var currentTower = towers[i]; // 获取当前遍历到的塔  
                            // 根据塔的索引分配目标  
                            var targetIndexToAttack;  
                            // 根据敌人数量分配目标  
                            if (targets.length === 1) {  
                                // 如果只有一个敌人，所有塔都攻击这个敌人  
                                targetIndexToAttack = 0;  
                            } else {  
                                // 如果敌人数量大于或等于2  
                                if (i < 3) {  
                                    // 前三个塔攻击第一个敌人  
                                    targetIndexToAttack = 0;  
                                } else {  
                                    // 其余的塔攻击第二个敌人（或者根据逻辑可以是其他敌人）  
                                    targetIndexToAttack = 1;  
                                }  
                            }  
                            var target = targets[targetIndexToAttack]; // 使用模运算确保索引不会越界  
                            // 检查目标是否在白名单中（假设 targets[x].owner 是有效的，并且具有 username 属性） 
                            if (this.blacklist.includes(target.owner.username)) {
                                if (!tasksList.some(task => task.type === 'spawn')) {  
                                    this.pushSpawnTask(tasksList);
                                }  
                            } 
                            if (!this.whitelist.includes(target.owner.username)) {  
                                currentTower.attack(target); // 攻击目标  
                            }  
                        }  
                    } else {
                        if (tasksList.some(task => task.type === 'spawn')) {  
                            Memory.rooms[tower.room.name].tasks = tasksList.filter(task => task.type !== 'spawn');
                        } 
                        //Memory.rooms[tower.room.name].tasks = tasksList.filter(task => task.type !== 'spawn');
                        const ramparts = tower.room.rampart;  
                        // console.log(ramparts)
                        const lowHitsRamparts = ramparts.filter(rampart => rampart.hits < 100000);   
                        lowHitsRamparts.sort((a, b) => a.hits - b.hits);  
                        tower.repair(lowHitsRamparts[0]);  
                        if(Game.time % 1 === 0 ){
                            const roads = tower.room.road;
                            const containers = tower.room.container;
                            const lowEnergyRoads = roads.filter(road => road.hits < road.hitsMax * 0.6);
                            const lowEnergyContainers = containers.filter(container => container.hits < container.hitsMax * 0.8);   
                            if (lowEnergyRoads.length > 0){              //修复Road
                                tower.repair(lowEnergyRoads[0]);
                            } else if (lowEnergyContainers.length > 0){ // 修复容器
                                tower.repair(lowEnergyContainers[0]);
                            } 
                        }
                    }
                }
                if(Game.time % 2 === 0 ){
                    const powerCreep = Game.powerCreeps['花枝'];
                    const damagedCreeps = tower.room.find(FIND_MY_CREEPS, {  
                        filter: (creep) => (  
                            creep.hits < creep.hitsMax 
                        )  
                    });  
                    if (damagedCreeps.length > 0) {      //治疗creep
                        tower.heal(damagedCreeps[0]);
                    } else if(powerCreep.hits < powerCreep.hitsMax){
                        tower.heal(powerCreep);
                    }
                }
                // if(Game.time % 3 === 0 ){
                //     const roads = tower.room.road;
                //     const containers = tower.room.container;
                //     const lowEnergyRoads = roads.filter(road => road.hits < road.hitsMax * 0.6);
                //     const lowEnergyContainers = containers.filter(container => container.hits < container.hitsMax * 0.6);   
                //     if (lowEnergyRoads.length > 0){              //修复Road
                //         tower.repair(lowEnergyRoads[0]);
                //     } else if (lowEnergyContainers.length > 0){ // 修复容器
                //         tower.repair(lowEnergyContainers[0]);
                //     } 
                // }
                // function findClosestTarget(creep, targets) {  
                //     let closest = targets[0];  
                //     let minDistance = creep.pos.getRangeTo(closest);  
                //     for (let i = 1; i < targets.length; i++) {  
                //         let distance = creep.pos.getRangeTo(targets[i]);  
                //         if (distance < minDistance) {  
                //             closest = targets[i];  
                //             minDistance = distance;  
                //         }  
                //     }  
                //     return closest;  
                // }
            }
        }
    },  
    pushSpawnTask: function(tasksList) {
        console.log(`在房间中检测到黑名单玩家，正在发布 Spawn 任务到 ${tasksList.roomName} 房间的物流队列中`);
        tasksList.push({
            type: 'spawn'
        });
    },
    /**  
     * 推送 fillTower 任务到房间物流队列
     * @param {StructureTower} tower - 当前的塔对象  
     */  
    pushFillTowerTask: function(tower, tasksList) {  
        console.log(`正在为塔 ${tower.id} 推送填充任务到 ${tower.room.name} 房间的物流队列中...`);
        tasksList.push({  
            type: 'fillTower',  
            id: tower.id  
        });  
    },
};  

function findRecentlyAttackedRamparts(room) {
    // 获取最近的事件日志
    const eventLog = room.getEventLog();
    // 用于存储受到攻击的rampart ID
    let attackedRamparts = [];
    // 遍历事件日志
    for (const event of eventLog) {
        // 检查事件类型是否为ATTACK
        if (event.event === EVENT_ATTACK && event.data && event.data.target) {
            // 检查目标是否是rampart
            if (event.data.target.type === 'rampart') {
                // 添加受到攻击的rampart ID到数组中
                attackedRamparts.push(event.data.target.id);
            }
        }
    }
    // 返回受到攻击的rampart ID数组
    return attackedRamparts;
}
export default Tower;