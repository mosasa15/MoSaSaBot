import { Process } from '../core/Process';
import AutoRoom from '../managers/roomManager';
import { SourceManager } from '../managers/SourceManager';
import DowngradeMonitor from '@/managers/DowngradeMonitor';
import { safeRun } from '@/utils/safe';

export class RoomProcess implements Process {
    public run(): void {
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            if (room.controller && room.controller.my) {
                safeRun(`RoomProcess:${roomName}`, () => {
                    DowngradeMonitor.run(room);
                    AutoRoom.run(room);
                    SourceManager.run(room);
                });
            }
        }
    }
}
