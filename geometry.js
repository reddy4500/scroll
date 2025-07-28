import * as C from './constants.js';

/**
 * Calculates the (x, y) coordinates of a point on an involute.
 * @param {number} phi - The involute angle (rad).
 * @param {number} phi_0 - The initial angle on the base circle (rad).
 * @param {string} scrollType - 'fixed' or 'orbiting'.
 * @param {number} theta - The crank angle (rad).
 * @returns {{x: number, y: number}} The Cartesian coordinates.
 */
export function getInvoluteCoords(phi, phi_0, scrollType, theta = 0) {
    let x, y;
    // Equations for the fixed scroll (Eq. 1)
    const fixed_x = C.r_b * (Math.cos(phi) + (phi - phi_0) * Math.sin(phi));
    const fixed_y = C.r_b * (Math.sin(phi) - (phi - phi_0) * Math.cos(phi));

    if (scrollType === 'fixed') {
        x = fixed_x;
        y = fixed_y;
    } else { // orbiting
        // Equations for the orbiting scroll (Eq. 7)
        const Theta_shift = C.phi_ie - theta - Math.PI / 2;
        x = -fixed_x + C.r_o * Math.cos(Theta_shift);
        y = -fixed_y + C.r_o * Math.sin(Theta_shift);
    }
    return { x, y };
}

// Green's Theorem anti-derivative for area contribution of a fixed scroll involute (Eq. 67)
function Gr_f(phi, phi_0) {
    return (phi * C.r_b ** 2 / 6) * (phi ** 2 - 3 * phi * phi_0 + 3 * phi_0 ** 2);
}

// Green's Theorem anti-derivative for area contribution of an orbiting scroll involute (Eq. 69)
function Gr_o(phi, phi_0, theta) {
    const Theta_shift = C.phi_ie - theta - Math.PI / 2;
    const term1 = C.r_b * (phi**3 - 3 * phi**2 * phi_0 + 3 * phi * phi_0**2);
    const term2 = 3 * (phi - phi_0) * C.r_o * Math.cos(phi - Theta_shift);
    const term3 = -3 * C.r_o * Math.sin(phi - Theta_shift);
    return (C.r_b / 6) * (term1 + term2 + term3);
}

// Area contribution from a line segment (Eq. 56)
function lineAreaContribution(p1, p2) {
    return 0.5 * (p1.x * p2.y - p2.x * p1.y);
}

// Calculates the suction separation angle (Appendix B)
function getPhiSsa(theta) {
    const A = C.phi_i0 - C.phi_ie + (C.r_o / C.r_b) * Math.cos(theta);
    const B = 1 + (C.r_o / C.r_b) * Math.sin(theta);
    const C_const = -1;
    let S_squared = A ** 2 + B ** 2 - C_const ** 2;
    if (S_squared < 0) S_squared = 0; // Avoid numerical issues
    const S = Math.sqrt(S_squared);
    const u = (A + S) / (B - C_const); 
    const delta = 2 * Math.atan(u);
    return C.phi_oe - Math.PI + delta;
}

/**
 * Calculates the volume of a single chamber using Green's Theorem.
 */
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

// --- CHAMBER DEFINITIONS ---
export const Nc_max = Math.floor((C.phi_oe - C.phi_os - Math.PI) / (2 * Math.PI));
export const theta_d = C.phi_oe - C.phi_os - 2 * Math.PI * Nc_max - Math.PI;

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
        outer_scroll_type: 'fixed', phi_O_max_f: t => C.phi_ie - t - 2 * Math.PI * Nc_max, phi_O_min_f: t => C.phi_os + Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'orbiting', phi_I_max_f: t => C.phi_oe - t - Math.PI - 2 * Math.PI * Nc_max, phi_I_min_f: t => C.phi_os,
        phi_I_0: C.phi_o0,
        color: 'rgba(13, 148, 136, 0.7)'
    },
    'd2': {
        outer_scroll_type: 'orbiting', phi_O_max_f: t => C.phi_ie - t - 2 * Math.PI * Nc_max, phi_O_min_f: t => C.phi_os + Math.PI,
        phi_O_0: C.phi_i0,
        inner_scroll_type: 'fixed', phi_I_max_f: t => C.phi_oe - t - Math.PI - 2 * Math.PI * Nc_max, phi_I_min_f: t => C.phi_os,
        phi_I_0: C.phi_o0,
        color: 'rgba(2, 132, 199, 0.7)'
    }
};
