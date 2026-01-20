import { DOWNGRADE_PROTECTION } from '@/config/protectionConfig';

export default {
    run: function(room: Room) {
        // Basic validation
        if (!room.controller || !room.controller.my) return;
        
        // Interval check
        if (Game.time % DOWNGRADE_PROTECTION.NOTIFY_INTERVAL !== 0) return;

        const controller = room.controller;
        // Check for max ticks based on controller level
        // CONTROLLER_DOWNGRADE is a global constant in Screeps
        const maxTicks = (CONTROLLER_DOWNGRADE && CONTROLLER_DOWNGRADE[controller.level]) || 0;
        const ticks = controller.ticksToDowngrade;

        // Skip if maxTicks is not defined (e.g. level 8 might behave differently or type definitions missing)
        if (!maxTicks) return;

        if (ticks < DOWNGRADE_PROTECTION.CRITICAL_THRESHOLD_TICKS) {
            const msg = `[CRITICAL] Room ${room.name} is about to downgrade! Ticks: ${ticks}. Immediate action required!`;
            console.log(msg);
            if (DOWNGRADE_PROTECTION.ENABLE_NOTIFY) Game.notify(msg);
            
            // Resource check log
            if (room.energyAvailable < room.energyCapacityAvailable * 0.3) {
                 const resourceMsg = `[CRITICAL] Room ${room.name} has low energy (${room.energyAvailable}) during downgrade crisis! Upgrade might fail!`;
                 console.log(resourceMsg);
                 if (DOWNGRADE_PROTECTION.ENABLE_NOTIFY) Game.notify(resourceMsg);
            }
        } else if (ticks < maxTicks * DOWNGRADE_PROTECTION.WARNING_THRESHOLD_PERCENT) {
             console.log(`[WARNING] Room ${room.name} downgrade timer is low: ${ticks}/${maxTicks} (${((ticks/maxTicks)*100).toFixed(1)}%)`);
        }
    }
};
