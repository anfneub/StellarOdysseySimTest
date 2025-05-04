import { MobName, mob_properties } from './dataclasses.js';

class Mob {
    constructor(name, lvl) {
        this.name = name;
        this.lvl = lvl;
        this.weaknesses = mob_properties[this.name].weaknesses;
        this.output_class = mob_properties[this.name].mob_class;
        this.hp = 800.0 * this.lvl;
        this.dmg = 7.0 * this.lvl;
        this.pre = 2.0 * this.lvl;
        this.eva = 2.0 * this.lvl;

        this.current_hp = this.hp;
        this.hit_counter = 0;

        this.crit_chance = 0.0;
        this.crit_dmg = 0.0;
    }

    toString() {
        return `I am a ${this.name} mob of level ${this.lvl}. My weaknesses are ${this.weaknesses.join(', ')}.`;
    }
}

export { Mob }; 