import { Battle } from './battle.js';
import { Mob } from './mob.js';
import { Player } from './player.js';
import { CloneModifiers } from './dataclasses.js';

class Optimizer {
    constructor(player, mob, list_modifiers = null, n_fights = 5000) {
        this.player = player;
        this.list_modifiers = list_modifiers;
        this.mob = mob;
        this.n_fights = n_fights;
    }

    distribute_points(n_points) {
        // Distribute n points in k categories, only keeping those close to a 1:4:4:3 ratio within a given tolerance.
        const k = 4;
        const ratio = [1, 4, 4, 3];
        const ratio_sum = ratio.reduce((a, b) => a + b, 0);
        const ideal = ratio.map(r => Math.round(n_points * r / ratio_sum));
        const tolerance = 3;
        const results = [];
        function helper(remaining, parts) {
            if (parts.length === k - 1) {
                const last = remaining;
                const lcl = parts.concat([last]);
                if (lcl.every((val, i) => Math.abs(val - ideal[i]) <= tolerance)) {
                    results.push(lcl);
                }
                return;
            }
            for (let i = 0; i <= remaining; i++) {
                helper(remaining - i, parts.concat([i]));
            }
        }
        helper(n_points, []);
        return results;
    }

    optimize() {

        let hits_to_die;
        let hits_to_kill;

        if (this.player.n_clones < 5) {
            hits_to_die = 5;
            hits_to_kill = 7;
        }
        else {
            hits_to_die = 4;
            hits_to_kill = 6;
        }

        const total_hp_to_have = (hits_to_die - 1) * this.mob.dmg + 1;
        const remaining_hp = Math.max(0.0, total_hp_to_have - this.player.shield_def);
        const needed_hull = Math.ceil(remaining_hp / 7.0);

        let weapon1 = this.player.weapon_ele1, weapon2 = this.player.weapon_ele2;
        if ((weapon1 && (!weapon2 || weapon2 === 'None')) && weapon1 !== 'None') weapon2 = weapon1;
        if ((weapon2 && (!weapon1 || weapon1 === 'None')) && weapon2 !== 'None') weapon1 = weapon2;
        let shield1 = this.player.shield_ele1, shield2 = this.player.shield_ele2;
        if ((shield1 && (!shield2 || shield2 === 'None')) && shield1 !== 'None') shield2 = shield1;
        if ((shield2 && (!shield1 || shield1 === 'None')) && shield2 !== 'None') shield1 = shield2;
        const modifications = [weapon1, weapon2, shield1, shield2];
        const target_weaknesses = this.mob.weaknesses || [];
        let total_damage_modifier = 0.0;
        for (const mod of modifications) {
            if (mod && target_weaknesses.includes(mod)) {
                total_damage_modifier += 0.15;
            }
        }

        const total_attack_to_have = this.mob.hp / hits_to_kill + 1;
        const needed_pow = Math.ceil(Math.max(0.0, (total_attack_to_have - this.player.n_clones * this.player.weapon_dmg * (1 + total_damage_modifier)) / (7.0 * this.player.n_clones * (1 + total_damage_modifier))));

        const nb_points = Math.floor(this.player.pow + this.player.pre + this.player.eva + this.player.hull);
        const available_points = nb_points - needed_pow - needed_hull;
        const lcl_result = [];

        for (let p = 0; p <= available_points; p++) {
            const power = needed_pow;
            const precision = p;
            const evasion = available_points - p;
            const hull = needed_hull;
            const tmp_player = new Player({
                power,
                precision,
                evasion,
                hull,
                weapon_dmg: this.player.weapon_dmg,
                shield_def: this.player.shield_def,
                n_clones: this.player.n_clones,
                vip_status: this.player.vip_status,
                weapon_ele1: this.player.weapon_ele1,
                weapon_ele2: this.player.weapon_ele2,
                shield_ele1: this.player.shield_ele1,
                shield_ele2: this.player.shield_ele2
            });
            const battle = new Battle({ player: tmp_player, mob: this.mob, list_modifiers: this.list_modifiers });
            const win_chance = battle.repeat_fights(this.n_fights);
            lcl_result.push({ stats: [power, precision, evasion, hull], win_chance });
        }
        const opt_results = lcl_result.sort((a, b) => b.win_chance - a.win_chance);

        if (opt_results.length === 0) {
            return null;
        }
        return { bestStats: opt_results[0].stats, winChance: opt_results[0].win_chance };
    }
}

export { Optimizer };
