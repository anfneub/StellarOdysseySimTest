// probabilities.js

/**
 * Returns the binomial coefficient (n choose k).
 */
function comb(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let res = 1;
    for (let i = 1; i <= k; i++) {
        res = res * (n - i + 1) / i;
    }
    return res;
}

/**
 * Probability that at least k categories appear among g gatherables, each assigned randomly to one of m categories.
 */
function prob_at_least_k_categories(g, k, m = 4) {
    if (k > m || k > g) return 0;
    if (k === 0) return 1;
    if (k === 1) return 1.0;  // Always 1.0 since every gathering node must have a category
    
    // For k > 1, use inclusion-exclusion principle
    let total = 0;
    for (let i = 0; i <= m - k; i++) {
        const sign = (i % 2 === 0) ? 1 : -1;
        const term = sign * comb(m, i) * Math.pow((m - k - i + 1) / m, g);
        total += term;
    }
    return Math.max(0, Math.min(1, total * comb(m, k) / comb(m, m)));
}

/**
 * Get probability a random gatherable body has a quality within a specified range.
 * @param {string|Array} qualityRange - "Any" or [start, end]
 */
function prob_primary_quality_in_range(qualityRange) {
    if (qualityRange === "Any") return 1.0;

    const a = qualityRange[0], b = qualityRange[1];
    // Quality bins: [start, end, probability]
    const bins = [
        [1, 30, 0.80],
        [31, 70, 0.10],
        [71, 90, 0.09],
        [91, 100, 0.01]
    ];
    let prob = 0.0;
    for (const [s, e, p] of bins) {
        const overlap_start = Math.max(a, s);
        const overlap_end = Math.min(b, e);
        if (overlap_start > overlap_end) continue;
        const overlap = overlap_end - overlap_start + 1;
        const bin_size = e - s + 1;
        prob += p * (overlap / bin_size);
    }
    return prob;
}

/**
 * Main probability calculation function.
 * 
 * @param {number|string} n_nodes - number of nodes or "Any"
 * @param {string} n_nodes_type - "exactly" | "at least"
 * @param {number|string} n_gatherable - number of gatherable nodes or "Any"
 * @param {string} n_gatherable_type - "exactly" | "at least"
 * @param {number|string} n_categories - number of categories or "Any"
 * @param {string} n_categories_type - "exactly" | "at least"
 * @param {Array} qualities_per_gatherable - array of "Any" or [start, end] for each gatherable node required (e.g., ["Any", [1,30], [31,70]])
 * @param {boolean} inhabited_system - whether the system is inhabited
 * @returns {number} probability
 */
function probability_of_observation_with_per_gatherable_qualities(
    n_nodes,
    n_nodes_type,
    n_gatherable,
    n_gatherable_type,
    n_categories,
    n_categories_type,
    qualities_per_gatherable,
    inhabited_system
) {
    const max_nodes = 5;
    const p_gather = 0.6;
    let total_prob = 0.0;

    // Calculate inhabited system probability
    const inhabited_prob = inhabited_system === null ? 1.0 : (inhabited_system ? 0.35 : 0.65);

    function* node_size_iter() {
        if (n_nodes === "Any") {
            for (let m = 1; m <= max_nodes; ++m)
                yield [m, 1.0 / max_nodes];
        } else if (n_nodes_type === "exactly") {
            if (n_nodes < 1 || n_nodes > max_nodes) return;
            yield [n_nodes, 1.0 / max_nodes];
        } else if (n_nodes_type === "at least") {
            for (let m = n_nodes; m <= max_nodes; ++m)
                yield [m, 1.0 / max_nodes];
        }
    }

    for (const [system_size, p_sys_size] of node_size_iter()) {
        let gatherable_prob = 0.0;

        let gather_range = [];
        if (n_gatherable === "Any") {
            for (let g = 0; g <= system_size; ++g) gather_range.push(g);
        } else if (n_gatherable_type === "exactly") {
            if (n_gatherable < 0 || n_gatherable > system_size) continue;
            gather_range = [n_gatherable];
        } else if (n_gatherable_type === "at least") {
            for (let g = n_gatherable; g <= system_size; ++g) gather_range.push(g);
        }

        for (const g of gather_range) {
            const p_g = comb(system_size, g) * Math.pow(p_gather, g) * Math.pow(1 - p_gather, system_size - g);
            
            // Debug log for exactly 4 gathering nodes with Any system size
            if (n_nodes === "Any" && n_gatherable === 4 && n_gatherable_type === "exactly") {
                console.log(`System size ${system_size}: P = ${p_g}, weighted = ${p_g * p_sys_size}`);
            }

            // Categories step
            let cat_prob = 1.0;
            if (g === 0 || n_categories === "Any") {
                cat_prob = 1.0;
            } else {
                if (n_categories_type === "exactly") {
                    if (n_categories < 1 || n_categories > Math.min(g, 4)) {
                        cat_prob = 0.0;
                    } else {
                        cat_prob = prob_at_least_k_categories(g, n_categories, 4)
                                 - prob_at_least_k_categories(g, n_categories + 1, 4);
                    }
                } else if (n_categories_type === "at least") {
                    if (n_categories < 1 || n_categories > Math.min(g, 4)) {
                        cat_prob = 0.0;
                    } else {
                        cat_prob = prob_at_least_k_categories(g, n_categories, 4);
                    }
                }
            }

            // Per-gatherable node quality constraints
            let prob_qualities = 1.0;
            for (let i = 0; i < g; ++i) {
                let q_range = (i < qualities_per_gatherable.length) ? qualities_per_gatherable[i] : "Any";
                prob_qualities *= prob_primary_quality_in_range(q_range);
            }

            gatherable_prob += p_g * cat_prob * prob_qualities;
        }

        total_prob += p_sys_size * gatherable_prob;
    }
    return Math.max(0, Math.min(1, total_prob * inhabited_prob));
}

export {
    probability_of_observation_with_per_gatherable_qualities,
    prob_primary_quality_in_range,
    comb
};
