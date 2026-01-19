import PowerCreep from '@/powerCreep/powerCreep';

export function runPowerCreep() {
    const powerCreepIds = ['花枝']; 
    powerCreepIds.forEach(powerCreepId => {  
        const powerCreep = Game.powerCreeps[powerCreepId];  
        if (powerCreep) {
            PowerCreep.run(powerCreep);  
        } 
    });

}