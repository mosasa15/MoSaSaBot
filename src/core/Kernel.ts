import { errorMapper } from '../utils/errorMapper';
import { Process } from './Process';

export class Kernel {
    private processes: Process[] = [];

    public addProcess(process: Process): void {
        this.processes.push(process);
    }

    public run(): void {
        errorMapper(() => {
            // TODO: Memory caching logic
            
            for (const process of this.processes) {
                try {
                    process.run();
                } catch (e) {
                    console.log(`Error in process: ${e}`);
                }
            }
        });
    }
}
