import { getCpuMultiplier, getCpuTier } from '@/utils/cpuPolicy';
import { safeRun } from '@/utils/safe';
 
export type CpuTier = 'low' | 'normal' | 'high';
 
export type StageContext = {
    tick: number;
    cpuTier: CpuTier;
    cpuMultiplier: number;
    bucket: number;
};
 
export type StageDefinition = {
    name: string;
    run: (ctx: StageContext) => void;
    every?: number;
    minBucket?: number;
    minTier?: CpuTier;
    cpuLimit?: number;
};
 
function tierRank(tier: CpuTier): number {
    if (tier === 'low') return 0;
    if (tier === 'normal') return 1;
    return 2;
}
 
export class SystemScheduler {
    private stages: StageDefinition[] = [];
 
    public addStage(stage: StageDefinition): this {
        this.stages.push(stage);
        return this;
    }
 
    public run(): void {
        const cpuTier = getCpuTier() as CpuTier;
        const cpuMultiplier = getCpuMultiplier();
        const bucket = Game.cpu && typeof Game.cpu.bucket === 'number' ? Game.cpu.bucket : 0;
 
        (globalThis as any).cpuTier = cpuTier;
        (globalThis as any).cpuMultiplier = cpuMultiplier;
        (globalThis as any).__tickStartCpu = Game.cpu.getUsed();
 
        const ctx: StageContext = {
            tick: Game.time,
            cpuTier,
            cpuMultiplier,
            bucket
        };
 
        for (const stage of this.stages) {
            if (stage.every && stage.every > 1 && ctx.tick % stage.every !== 0) continue;
            if (typeof stage.minBucket === 'number' && ctx.bucket < stage.minBucket) continue;
            if (stage.minTier && tierRank(ctx.cpuTier) < tierRank(stage.minTier)) continue;
 
            const before = Game.cpu.getUsed();
            safeRun(`stage:${stage.name}`, () => stage.run(ctx));
            const after = Game.cpu.getUsed();
 
            if (typeof stage.cpuLimit === 'number') {
                const limit = stage.cpuLimit * ctx.cpuMultiplier;
                if (after - before > limit) break;
            }
        }
    }
}
