import AutoRoom from '@/room/autoRoom';

export function runRoom() {
    // Run every tick or use the modulo logic if desired. 
    // Usually running every tick is fine for local logic unless CPU is tight.
    
    // Iterate over all visible rooms
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        
        // Check if we own the room
        if (room.controller && room.controller.my) {
            try {
                AutoRoom.run(room);
            } catch (e) {
                console.log(`Error running AutoRoom for ${roomName}:`, e);
                console.log(e.stack);
            }
        }
    }
}
