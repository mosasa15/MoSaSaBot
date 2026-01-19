const BodyGenerator = {
    /**
     * Generate a body array based on available energy and role requirements.
     * @param {number} energyAvailable - The amount of energy available for spawning.
     * @param {string} role - The role of the creep.
     * @returns {string[]} - Array of body parts.
     */
    generate: function(energyAvailable, role) {
        // Default minimum body cost is 200 (WORK, CARRY, MOVE)
        const minEnergy = 200;
        let body = [];
        
        // Use energyCapacityAvailable if energyAvailable is very low but we want to plan? 
        // No, we must use energyAvailable to spawn NOW.
        // However, usually we want to target energyCapacityAvailable for efficiency, 
        // but if we are recovering (0 creeps), we must use energyAvailable.
        // For safety, let's use Math.max(energyAvailable, 300) for logic, but we can't spawn if we don't have it.
        // Actually, we should just use what we have, but ensure we don't make tiny creeps if we have capacity.
        // BUT for a "recover" mode, we just use what is there.
        
        // Simplified Logic: 
        // 1. Define a "pattern" for the role (e.g. [WORK, CARRY, MOVE]).
        // 2. Repeat pattern until max cost or max parts (50).
        
        let pattern = [WORK, CARRY, MOVE];
        let maxParts = 50;
        
        switch (role) {
            case 'harvester':
                // Harvesters need more WORK, fewer MOVE if static, but for generic we assume mobile.
                // Pattern: [WORK, WORK, MOVE] (250) or [WORK, CARRY, MOVE] (200)
                pattern = [WORK, WORK, CARRY, MOVE]; // Cost: 300
                // Fallback for very low energy
                if (energyAvailable < 300) pattern = [WORK, CARRY, MOVE]; 
                break;
                
            case 'upgrader':
                // Upgraders need WORK, CARRY, MOVE
                pattern = [WORK, CARRY, MOVE, MOVE]; // Cost: 250
                if (energyAvailable < 250) pattern = [WORK, CARRY, MOVE];
                break;
                
            case 'builder':
                pattern = [WORK, CARRY, MOVE, MOVE]; // Cost: 250
                if (energyAvailable < 250) pattern = [WORK, CARRY, MOVE];
                break;
                
            case 'manager':
            case 'transferer':
                // Haulers need CARRY, MOVE. No WORK.
                pattern = [CARRY, CARRY, MOVE]; // Cost: 150
                if (energyAvailable < 150) pattern = [CARRY, MOVE];
                break;
                
            default:
                pattern = [WORK, CARRY, MOVE];
                break;
        }
        
        const patternCost = this.calculateCost(pattern);
        let currentCost = 0;
        
        // Always add at least one pattern set
        body = [...pattern];
        currentCost += patternCost;
        
        // If we can't even afford one pattern, we return a minimal body if possible, or just the pattern (spawn will fail)
        if (energyAvailable < currentCost) {
            // Try absolute minimum: [WORK, CARRY, MOVE] or [CARRY, MOVE]
            if (role === 'manager' || role === 'transferer') return [CARRY, MOVE];
            return [WORK, CARRY, MOVE];
        }
        
        // Add more parts as long as we have energy and space
        while (currentCost + patternCost <= energyAvailable && body.length + pattern.length <= maxParts) {
            body = body.concat(pattern);
            currentCost += patternCost;
        }
        
        return body;
    },
    
    calculateCost: function(body) {
        return body.reduce((cost, part) => cost + BODYPART_COST[part], 0);
    }
};

export default BodyGenerator;
