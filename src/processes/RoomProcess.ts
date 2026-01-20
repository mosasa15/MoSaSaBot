import { Process } from '../core/Process';
import AutoRoom from '../managers/roomManager';
import { SourceManager } from '../managers/SourceManager';
import { CreepDemandManager } from '../managers/CreepDemandManager';
import DowngradeMonitor from '@/managers/DowngradeMonitor';

export class RoomProcess implements Process {
    public run(): void {
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (room.controller && room.controller.my) {
                try {
                    DowngradeMonitor.run(room);
                    AutoRoom.run(room);
                    SourceManager.run(room);
                    CreepDemandManager.run(room);
                } catch (e) {
                    console.log(`Error running RoomProcess for ${roomName}:`, e);
                }
            }
        }
    }
}
