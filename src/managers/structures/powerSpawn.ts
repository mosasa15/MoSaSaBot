var powerSpawn ={
    run: function( roomName ) {  
        // 获取当前房间的内存 
        let room = Game.rooms[roomName];
        const powerSpawn = room.powerSpawn;
        powerSpawn.processPower()
        // Game.powerCreeps['花枝'].spawn(powerSpawn);
    }
}

export default powerSpawn;