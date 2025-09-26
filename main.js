import { Player } from './player.js';
import { Mob } from './mob.js';
import { Optimizer } from './optimizer.js';
import { CloneModifiers, MobName, Element } from './dataclasses.js';

// Example main logic, similar to main.py
const player = new Player({
    power: 35,
    precision: 110,
    evasion: 95,
    hull: 80,
    weapon_dmg: 915,
    shield_def: 1021,
    n_clones: 5,
    vip_status: true,
    weapon_ele: Element.KINETIC,
    shield_ele: Element.KINETIC
});

const clone_modifier1 = new CloneModifiers(0.01, 0.01, 0.05);
const clone_modifier2 = new CloneModifiers(0.0, 0.0, 0.05);
const list_modifiers = [clone_modifier1, clone_modifier1, clone_modifier1, clone_modifier2, clone_modifier2];

const mob = new Mob(MobName.SCORCHERS, 81);

const optimizer = new Optimizer(player, mob, list_modifiers);
optimizer.optimize(); 