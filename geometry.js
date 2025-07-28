import *in C from './constants.js';

/**
 * Calculates the (x, y) coordinates of a point on an involute.
 * (No changes to this function)
 */
export function getInvoluteCoords(phi, phi_0, scrollType, theta = 0) {
    let x, y;
    const fixed_x = C.r_b * (Math.cos(phi) + (phi - phi_0) * Math.sin(phi));
    const fixed_y = C.r_b * (Math.sin(phi) - (phi - phi_0) * Math.cos(phi));

    if (scrollType === 'fixed') {
        x = fixed_x;
        y = fixed_y;
    } else { // orbiting
        const Theta_shift = C.phi_ie - theta - Math.PI / 2; // This is one way to define orbiting motion
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
    // Find where the distance from the arc center to a point on the involute equals the arc radius
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

    const involute1 = inv1_full.slice(idx_tan1);
    const involute2 = inv2_full.slice(idx_tan2);

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
    const line_end_x = C.xa2_fixed_center - C.ra2 * Math.cos(theta1); // Simplified from python code
    const line_end_y = C.ya2_fixed_center - C.ra2 * Math.sin(theta1);

    const line = [{ x: line_start_x, y: line_start_y }, { x: line_end_x, y: line_end_y }];

    // --- 4. Calculate the arc points ---
    const theta_p1 = Math.atan2(line_start_y - C.ya1_fixed_center, line_start_x - C.xa1_fixed_center);
    let theta_inv1 = Math.atan2(involute1[0].y - C.ya1_fixed_center, involute1[0].x - C.xa1_fixed_center);
    if (theta_inv1 <= theta_p1) theta_inv1 += 2 * Math.PI;

    const arc1 = [];
    for (let i = 0; i <= 100; i++) {
        const angle = theta_p1 + (theta_inv1 - theta_p1) * i / 100;
        arc1.push({
            x: C.xa1_fixed_center + C.ra1 * Math.cos(angle),
            y: C.ya1_fixed_center + C.ra1 * Math.sin(angle)
        });
    }

    const theta_p2 = Math.atan2(line_end_y - C.ya2_fixed_center, line_end_x - C.xa2_fixed_center);
    let theta_inv2 = Math.atan2(involute2[0].y - C.ya2_fixed_center, involute2[0].x - C.xa2_fixed_center);
    if (theta_inv2 <= theta_p2) theta_inv2 += 2 * Math.PI;

    const arc2 = [];
    for (let i = 0; i <= 100; i++) {
        const angle = theta_p2 + (theta_inv2 - theta_p2) * i / 100;
        arc2.push({
            x: C.xa2_fixed_center + C.ra2 * Math.cos(angle),
            y: C.ya2_fixed_center + C.ra2 * Math.sin(angle)
        });
    }

    return { arc1, line, arc2, involute1, involute2 };
}


// --- Volume Calculation Functions ---
// NOTE: The volume calculation functions below are from your original code.
// They are based on the pure involute model and will NOT be accurate for the new
// arc-line-arc geometry, especially for the discharge chambers (d1, d2).
// Correcting the volume calculation is a much more complex task involving the
// integration over these new composite boundaries. The code is kept here to
// allow the rest of the application to function.

function Gr_f(phi, phi_0) { /* ... original code ... */ }
function Gr_o(phi, phi_0, theta) { /* ... original code ... */ }
function lineAreaContribution(p1, p2) { /* ... original code ... */ }
function getPhiSsa(theta) { /* ... original code ... */ }
export function calculateChamberVolume(chamberDef, theta) { /* ... original code ... */ }
export const Nc_max = Math.floor((C.phi_oe - (C.phi_os || 0) - Math.PI) / (2 * Math.PI));
export const theta_d = C.phi_oe - (C.phi_os || 0) - 2 * Math.PI * Nc_max - Math.PI;
export const chambers = { /* ... original code ... */ };
