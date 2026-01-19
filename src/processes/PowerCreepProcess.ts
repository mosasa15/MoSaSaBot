import { Process } from '../core/Process';
import PowerCreep from '../roles/powerCreep';

export class PowerCreepProcess implements Process {
    public run(): void {
        for (const name in Game.powerCreeps) {
            const creep = Game.powerCreeps[name];
            if (creep.ticksToLive) { // Spawning check? PowerCreeps don't have spawning property like creeps but check TTL or spawn status
                 try {
                     PowerCreep.run(creep);
                 } catch (e) {
                     console.log(`Error running PowerCreep ${name}:`, e);
                 }
            }
        }
    }
}