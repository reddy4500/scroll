import * as C from './constants.js';

/**
 * Calculates the (x, y) coordinates of a point on an involute.
 */
export function getInvoluteCoords(phi, phi_0, scrollType, theta = 0) {
    let x, y;
    const fixed_x = C.r_b * (Math.cos(phi) + (phi - phi_0) * Math.sin(phi));
    const fixed_y = C.r_b * (Math.sin(phi) - (phi - phi_0) * Math.cos(phi));

    if (scrollType === 'fixed') {
        x = fixed_x;
        y = fixed_y;
    } else { // orbiting
        // A more direct transformation is used in the new drawing functions for clarity
        x = -fixed_x + C.r_o * Math.cos(theta);
        y = -fixed_y + C.r_o * Math.sin(theta);
    }
    return { x, y };
}

/**
 * [NEW] Calculates the full geometry for the fixed scroll wrap, including the
 * central arc-line-arc discharge port, based on the Python script's logic.
 */
export function calculateBaseScrollGeometry() {
    // --- 1. Generate full involute curves ---
    const angles = [];
    for (let i = 0; i < 2000; i++) {
        angles.push(i * 0.01); // Corresponds to np.linspace(0, 20, 2000)
    }

    const inv1_full = angles.map(a => getInvoluteCoords(a, C.phi_i0, 'fixed'));
    const inv2_full = angles.map(a => getInvoluteCoords(a, C.phi_o0, 'fixed'));

    // --- 2. Find tangent points between arcs and involutes ---
    let minDist1 = Infinity,
        idx_tan1 = 0;
    inv1_full.forEach((p, i) => {
        const dist = Math.hypot(p.x - C.xa1_fixed_center, p.y - C.ya1_fixed_center);
        const diff = Math.abs(dist - C.ra1);
        if (diff < minDist1) {
            minDist1 = diff;
            idx_tan1 = i;
        }
    });

    let minDist2 = Infinity,
        idx_tan2 = 0;
    inv2_full.forEach((p, i) => {
        const dist = Math.hypot(p.x - C.xa2_fixed_center, p.y - C.ya2_fixed_center);
        const diff = Math.abs(dist - C.ra2);
        if (diff < minDist2) {
            minDist2 = diff;
            idx_tan2 = i;
        }
    });

    const involute1 = inv1_full.slice(idx_tan1, 1772); // Cut at phi_ie
    const involute2 = inv2_full.slice(idx_tan2, 1772); // Cut at phi_oe

    // --- 3. Calculate the connecting line between the two arcs ---
    const dx = C.xa2_fixed_center - C.xa1_fixed_center;
    const dy = C.ya2_fixed_center - C.ya1_fixed_center;
    const d = Math.hypot(dx, dy);
    if (d === 0 || (C.ra1 + C.ra2) > d) {
        throw new Error("Invalid arc geometry. Arcs are overlapping.");
    }

    const alpha = Math.atan2(dy, dx);
    const beta = Math.acos((C.ra1 + C.ra2) / d);
    const theta1 = beta + alpha;

    const line_start_x = C.xa1_fixed_center + C.ra1 * Math.cos(theta1);
    const line_start_y = C.ya1_fixed_center + C.ra1 * Math.sin(theta1);
    const line_end_x = C.xa2_fixed_center - C.ra2 * Math.cos(theta1);
    const line_end_y = C.ya2_fixed_center - C.ra2 * Math.sin(theta1);

    const line = [{ x: line_start_x, y: line_start_y }, { x: line_end_x, y: line_end_y }];

    // --- 4. Calculate the arc points ---
    const theta_p1 = Math.atan2(line_start_y - C.ya1_fixed_center, line_start_x - C.xa1_fixed_center);
    let theta_inv1 = Math.atan2(involute1[0].y - C.ya1_fixed_center, involute1[0].x - C.xa1_fixed_center);
    if (theta_inv1 <= theta_p1) theta_inv1 += 2 * Math.PI;

    const arc1 = [];
    for (let i = 0; i <= 50; i++) {
        const angle = theta_p1 + (theta_inv1 - theta_p1) * i / 50;
        arc1.push({
            x: C.xa1_fixed_center + C.ra1 * Math.cos(angle),
            y: C.ya1_fixed_center + C.ra1 * Math.sin(angle)
        });
    }

    const theta_p2 = Math.atan2(line_end_y - C.ya2_fixed_center, line_end_x - C.xa2_fixed_center);
    let theta_inv2 = Math.atan2(involute2[0].y - C.ya2_fixed_center, involute2[0].x - C.xa2_fixed_center);
    if (theta_inv2 <= theta_p2) theta_inv2 += 2 * Math.PI;

    const arc2 = [];
    for (let i = 0; i <= 50; i++) {
        const angle = theta_p2 + (theta_inv2 - theta_p2) * i / 50;
        arc2.push({
            x: C.xa2_fixed_center + C.ra2 * Math.cos(angle),
            y: C.ya2_fixed_center + C.ra2 * Math.sin(angle)
        });
    }

    return { arc1, line, arc2, involute1, involute2 };
}


// --- Original Volume Calculation Functions ---
// NOTE: These are based on the old, pure-involute model and will NOT be accurate
// for the new geometry, especially for discharge chambers (d1, d2).
// They are kept to allow the rest of the application to function without crashing.

function Gr_f(phi, phi_0) {
    return (phi * C.r_b ** 2 / 6) * (phi ** 2 - 3 * phi * phi_0 + 3 * phi_0 ** 2);
}

function Gr_o(phi, phi_0, theta) {
    const Theta_shift = C.phi_ie - theta - Math.PI / 2;
    const term1 = C.r_b * (phi**3 - 3 * phi**2 * phi_0 + 3 * phi * phi_0**2);
    const term2 = 3 * (phi - phi_0) * C.r_o * Math.cos(phi - Theta_shift);
    const term3 = -3 * C.r_o * Math.sin(phi - Theta_shift);
    return (C.r_b / 6) * (term1 + term2 + term3);
}

function lineAreaContribution(p1, p2) {
    return 0.5 * (p1.x * p2.y - p2.x * p1.y);
}

function getPhiSsa(theta) {
    const A = C.phi_i0 - C.phi_ie + (C.r_o / C.r_b) * Math.cos(theta);
    const B = 1 + (C.r_o / C.r_b) * Math.sin(theta);
    const C_const = -1;
    let S_squared = A ** 2 + B ** 2 - C_const ** 2;
    if (S_squared < 0) S_squared = 0;
    const S = Math.sqrt(S_squared);
    const u = (A + S) / (B - C_const);
    const delta = 2 * Math.atan(u);
    const phi_os_approx = 0.3; // Using an approximation as original is now dynamic
    return C.phi_oe - Math.PI + delta;
}

export function calculateChamberVolume(chamberDef, theta) {
    const { outer_scroll_type, phi_O_max_f, phi_O_min_f, phi_O_0, inner_scroll_type, phi_I_max_f, phi_I_min_f, phi_I_0 } = chamberDef;
    
    const phi_O_max = phi_O_max_f(theta);
    const phi_O_min = phi_O_min_f(theta);
    const phi_I_max = phi_I_max_f(theta);
    const phi_I_min = phi_I_min_f(theta);

    if (phi_O_max < phi_O_min || phi_I_max < phi_I_min) return 0;

    let area_O, area_I;
    if (outer_scroll_type === 'fixed') {
        area_O = Gr_f(phi_O_max, phi_O_0) - Gr_f(phi_O_min, phi_O_0);
    } else {
        area_O = Gr_o(phi_O_max, phi_O_0, theta) - Gr_o(phi_O_min, phi_O_0, theta);
    }

    if (inner_scroll_type === 'fixed') {
        area_I = Gr_f(phi_I_min, phi_I_0) - Gr_f(phi_I_max, phi_I_0);
    } else {
        area_I = Gr_o(phi_I_min, phi_I_0, theta) - Gr_o(phi_I_max, phi_I_0, theta);
    }

    const p_O_max = getInvoluteCoords(phi_O_max, phi_O_0, outer_scroll_type, theta);
    const p_O_min = getInvoluteCoords(phi_O_min, phi_O_0, outer_scroll_type, theta);
    const p_I_max = getInvoluteCoords(phi_I_max, phi_I_0, inner_scroll_type, theta);
    const p_I_min = getInvoluteCoords(phi_I_min, phi_I_0, inner_scroll_type, theta);

    const area_line_max = lineAreaContribution(p_O_max, p_I_max);
    const area_line_min = lineAreaContribution(p_I_min, p_O_min);

    const total_area = area_O + area_I + area_line_max + area_line_min;
    return C.h * total_area;
}

const phi_os_approx = 0.3; // Using an approximation as original phi_os is now dynamic
export const Nc_max = Math.floor((C.phi_oe - phi_os_approx - Math.PI) / (2 * Math.PI));
export const theta_d = C.phi_oe - phi_os_approx - 2 * Math.PI * Nc_max - Math.PI;

export const chambers = {
    's1': {
        outer_scroll_type: 'fixed', 
        phi_O_max_f: t => C.phi_ie, 
        phi_O_min_f: t => C.phi_ie - t,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'orbiting', 
        phi_I_max_f: t => getPhiSsa(t), 
        phi_I_min_f: t => C.phi_oe - t - Math.PI,
        phi_I_0: C.phi_o0,
        color: 'rgba(59, 130, 246, 0.7)'
    },
    's2': {
        outer_scroll_type: 'orbiting', 
        phi_O_max_f: t => C.phi_ie, 
        phi_O_min_f: t => C.phi_ie - t,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'fixed', 
        phi_I_max_f: t => getPhiSsa(t), 
        phi_I_min_f: t => C.phi_oe - t - Math.PI,
        phi_I_0: C.phi_o0,
        color: 'rgba(34, 197, 94, 0.7)'
    },
    'c1_1': {
        outer_scroll_type: 'fixed', phi_O_max_f: t => C.phi_ie - t, phi_O_min_f: t => C.phi_ie - t - 2 * Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'orbiting', phi_I_max_f: t => C.phi_oe - t - Math.PI, phi_I_min_f: t => C.phi_oe - t - 3 * Math.PI,
        phi_I_0: C.phi_o0,
        color: 'rgba(239, 68, 68, 0.7)'
    },
    'c2_1': {
        outer_scroll_type: 'orbiting', phi_O_max_f: t => C.phi_ie - t, phi_O_min_f: t => C.phi_ie - t - 2 * Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'fixed', phi_I_max_f: t => C.phi_oe - t - Math.PI, phi_I_min_f: t => C.phi_oe - t - 3 * Math.PI,
        phi_I_0: C.phi_o0,
        color: 'rgba(249, 115, 22, 0.7)'
    },
    'c1_2': {
        outer_scroll_type: 'fixed', phi_O_max_f: t => C.phi_ie - t - 2 * Math.PI, phi_O_min_f: t => C.phi_ie - t - 4 * Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'orbiting', phi_I_max_f: t => C.phi_oe - t - 3 * Math.PI, phi_I_min_f: t => C.phi_oe - t - 5 * Math.PI,
        phi_I_0: C.phi_o0,
        color: 'rgba(217, 70, 239, 0.7)'
    },
    'c2_2': {
        outer_scroll_type: 'orbiting', phi_O_max_f: t => C.phi_ie - t - 2 * Math.PI, phi_O_min_f: t => C.phi_ie - t - 4 * Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'fixed', phi_I_max_f: t => C.phi_oe - t - 3 * Math.PI, phi_I_min_f: t => C.phi_oe - t - 5 * Math.PI,
        phi_I_0: C.phi_o0,
        color: 'rgba(168, 85, 247, 0.7)'
    },
    'd1': {
        outer_scroll_type: 'fixed', phi_O_max_f: t => C.phi_ie - t - 2 * Math.PI * Nc_max, phi_O_min_f: t => phi_os_approx + Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'orbiting', phi_I_max_f: t => C.phi_oe - t - Math.PI - 2 * Math.PI * Nc_max, phi_I_min_f: t => phi_os_approx,
        phi_I_0: C.phi_o0,
        color: 'rgba(13, 148, 136, 0.7)'
    },
    'd2': {
        outer_scroll_type: 'orbiting', phi_O_max_f: t => C.phi_ie - t - 2 * Math.PI * Nc_max, phi_O_min_f: t => phi_os_approx + Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'fixed', phi_I_max_f: t => C.phi_oe - t - Math.PI - 2 * Math.PI * Nc_max, phi_I_min_f: t => phi_os_approx,
        phi_I_0: C.phi_o0,
        color: 'rgba(2, 132, 199, 0.7)'
    }
};
