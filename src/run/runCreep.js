import roleHarvester from '@/role/localCreep/role.harvester'
import roleUpgrader from '@/role/localCreep/role.upgrader';
import roleBuilder from '@/role/localCreep/role.builder';
import roleTransferer from '@/role/localCreep/role.transferer';
//import roleRepairer from '@/role/supportCreep/role.repairer';
import roleAttacker from '@/role/outMineCreep/role.attacker';
import roleclaimer from '@/role/supportCreep/role.claimer';
import rolethinker from '@/role/localCreep/role.thinker';
import roledefenser from '@/role/localCreep/role.defenser';
import roleNewHarvester from '@/role/outMineCreep/role.NewHarvester';
import roleNewtransferer from '@/role/outMineCreep/role.Newtransferer';
import roleScavenger from '@/role/supportCreep/role.scavenger';
import roleAdventurer from '@/role/supportCreep/role.adventurer';
import rolereserveController from '@/role/outMineCreep/role.reserveController';
import roleCentraltransferer from '@/role/localCreep/role.Centraltransferer';
import roleManager from '@/role/localCreep/role.manager';
import roleNewbuilder from '@/role/supportCreep/role.Newbuilder';
import team from '@/role/team';
import roledeposit_A from '@/role/remoteCreep/Deposit/role.deposit_A';
import roledeposit_B from '@/role/remoteCreep/Deposit/role.deposit_B';
import rolepower_A from '@/role/remoteCreep/Power/role.power_A';
import rolepower_B from '@/role/remoteCreep/Power/role.power_B';
import rolepower_C from '@/role/remoteCreep/Power/role.power_C';
import rolepower_D from '@/role/remoteCreep/Power/role.power_D';
import rolewallRepairer from '@/role/localCreep/role.wallRepairer';


const roleFunc = {
    harvester: roleHarvester,
    upgrader: roleUpgrader,
    builder: roleBuilder,
    transferer: roleTransferer,
    //repairer: roleRepairer,
    attacker: roleAttacker,
    claimer: roleclaimer,
    thinker: rolethinker,
    defenser: roledefenser,
    NewHarvester: roleNewHarvester,
    Newtransferer: roleNewtransferer,
    scavenger: roleScavenger,
    adventurer: roleAdventurer,
    reserveController: rolereserveController,
    Centraltransferer: roleCentraltransferer,
    manager: roleManager,
    Newbuilder: roleNewbuilder,
    Demolisher: team,
    Healer: team,
    deposit_A: roledeposit_A,
    deposit_B: roledeposit_B,
    power_A: rolepower_A,
    power_B: rolepower_B,
    power_C: rolepower_C,
    power_D: rolepower_D,
    wallRepairer: rolewallRepairer
}

export function runCreep(creep) {
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var role = creep.memory.role;
        if(roleFunc[role]) {
            roleFunc[role].run(creep);
        }
    }
}