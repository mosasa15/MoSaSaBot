// @ts-nocheck
import DowngradeMonitor from '@/managers/DowngradeMonitor';
import { DOWNGRADE_PROTECTION } from '@/config/protectionConfig';

export const runTests = () => {
    console.log('Starting DowngradeMonitor Tests...');

    // Mock Game and Room
    const mockRoom = {
        name: 'TestRoom_W1N1',
        controller: {
            my: true,
            level: 4,
            ticksToDowngrade: 100000
        },
        energyAvailable: 500,
        energyCapacityAvailable: 1000
    };

    // Global constant mock
    // Assuming level 4 max ticks is 20000 for testing purposes (actual is different but this tests logic)
    global.CONTROLLER_DOWNGRADE = { 4: 20000 }; 
    
    // Mock Game object if not exists (for standalone test)
    if (!global.Game) {
        global.Game = {
            time: 1000,
            notify: (msg) => console.log('[MOCK_NOTIFY]:', msg)
        };
    }

    // Test 1: Normal State (Ticks > 50% of 20000 = 10000)
    console.log('Test 1: Normal State (Ticks: 15000)');
    mockRoom.controller.ticksToDowngrade = 15000;
    DowngradeMonitor.run(mockRoom as any);
    
    // Test 2: Warning State (Ticks < 50% of 20000)
    console.log('Test 2: Warning State (Ticks: 9000)');
    mockRoom.controller.ticksToDowngrade = 9000; 
    DowngradeMonitor.run(mockRoom as any);

    // Test 3: Critical State (Ticks < 5000)
    console.log('Test 3: Critical State (Ticks: 4000)');
    mockRoom.controller.ticksToDowngrade = 4000; 
    DowngradeMonitor.run(mockRoom as any);

    // Test 4: Critical with Low Energy
    console.log('Test 4: Critical + Low Energy (Energy: 100)');
    mockRoom.energyAvailable = 100;
    DowngradeMonitor.run(mockRoom as any);

    console.log('Tests Completed.');
};
