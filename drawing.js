import * as C from './constants.js';
import { chambers, calculateBaseScrollGeometry, getInvoluteCoords } from './geometry.js';

let scale, centerX, centerY;
let baseGeometry; // Store the calculated base geometry to avoid recalculating

/**
 * Sets up the canvas dimensions and scaling factor.
 */
export function setupCanvas(canvas) {
    const size = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.9);
    canvas.width = size;
    canvas.height = size;
    const max_dim = C.r_b * (1 + C.phi_ie);
    scale = size / (max_dim * 2.5);
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;

    // Calculate the base geometry once
    baseGeometry = calculateBaseScrollGeometry();
}

/**
 * [NEW] Transforms a point for the orbiting scroll.
 * The orbiting scroll is mirrored and then translated by the orbiting radius.
 */
function transformToOrbiting(point, theta) {
    return {
        x: -point.x + C.r_o * Math.cos(theta),
        y: -point.y + C.r_o * Math.sin(theta)
    };
}

/**
 * [REWRITTEN] Draws the fixed scroll using the new composite geometry.
 */
function drawFixedScroll(ctx) {
    const { arc1, line, arc2, involute1, involute2 } = baseGeometry;

    // Combine all points into a single wrap for filling
    const fullWrap = [
        ...arc1,
        ...involute1,
    ];
    // Reverse the second wrap to create a closed shape for the scroll thickness
    const secondWrapReversed = [
        ...involute2,
        ...arc2,
        ...line.slice().reverse()
    ].reverse();

    const fillPoints = [...fullWrap, ...secondWrapReversed];

    ctx.beginPath();
    ctx.moveTo(centerX + fillPoints[0].x * scale, centerY - fillPoints[0].y * scale);
    fillPoints.slice(1).forEach(p => {
        ctx.lineTo(centerX + p.x * scale, centerY - p.y * scale);
    });
    ctx.closePath();
    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.fill();
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

/**
 * [REWRITTEN] Draws the orbiting scroll by transforming the fixed scroll geometry.
 */
function drawOrbitingScroll(ctx, theta) {
    const { arc1, line, arc2, involute1, involute2 } = baseGeometry;

    // Transform every point of the base geometry
    const orb_arc1 = arc1.map(p => transformToOrbiting(p, theta));
    const orb_line = line.map(p => transformToOrbiting(p, theta));
    const orb_arc2 = arc2.map(p => transformToOrbiting(p, theta));
    const orb_involute1 = involute1.map(p => transformToOrbiting(p, theta));
    const orb_involute2 = involute2.map(p => transformToOrbiting(p, theta));

    const fullWrap = [...orb_arc1, ...orb_involute1];
    const secondWrapReversed = [...orb_involute2, ...orb_arc2, ...orb_line.slice().reverse()].reverse();

    const fillPoints = [...fullWrap, ...secondWrapReversed];

    ctx.beginPath();
    ctx.moveTo(centerX + fillPoints[0].x * scale, centerY - fillPoints[0].y * scale);
    fillPoints.slice(1).forEach(p => {
        ctx.lineTo(centerX + p.x * scale, centerY - p.y * scale);
    });
    ctx.closePath();
    ctx.fillStyle = '#fca5a5'; // red-300
    ctx.fill();
    ctx.strokeStyle = '#b91c1c'; // red-700
    ctx.lineWidth = 1.5;
    ctx.stroke();
}


/**
 * Fills a specific chamber with its designated color.
 * NOTE: This function still uses the old involute-only definitions.
 * The visualization of chambers `d1` and `d2` will be incorrect as their
 * boundaries are now defined by the new arc-line-arc geometry.
 */
function drawChamber(ctx, chamberDef, theta) {
    const { outer_scroll_type, phi_O_max_f, phi_O_min_f, phi_O_0, inner_scroll_type, phi_I_max_f, phi_I_min_f, phi_I_0, color } = chamberDef;
    
    const phi_O_max = phi_O_max_f(theta);
    const phi_O_min = phi_O_min_f(theta);
    const phi_I_max = phi_I_max_f(theta);
    const phi_I_min = phi_I_min_f(theta);

    if (phi_O_max < phi_O_min || phi_I_max < phi_I_min) return;

    ctx.beginPath();
    ctx.fillStyle = color;
    const steps = 50;

    // Outer boundary
    const outerPoints = [];
    for (let i = 0; i <= steps; i++) {
        const phi = phi_O_min + (phi_O_max - phi_O_min) * i / steps;
        outerPoints.push(getInvoluteCoords(phi, phi_O_0, outer_scroll_type, theta));
    }
    
    // Inner boundary
    const innerPoints = [];
    for (let i = 0; i <= steps; i++) {
        const phi = phi_I_min + (phi_I_max - phi_I_min) * i / steps;
        innerPoints.push(getInvoluteCoords(phi, phi_I_0, inner_scroll_type, theta));
    }

    // Draw polygon
    const allPoints = [...outerPoints, ...innerPoints.reverse()];
    ctx.moveTo(centerX + allPoints[0].x * scale, centerY - allPoints[0].y * scale);
    allPoints.slice(1).forEach(p => {
        ctx.lineTo(centerX + p.x * scale, centerY - p.y * scale);
    });
    ctx.closePath();
    ctx.fill();
}


/**
 * Draws the entire scene on the canvas.
 */
export function drawScene(ctx, theta, selectedChamber) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw fixed and orbiting scrolls first
    drawFixedScroll(ctx);
    drawOrbitingScroll(ctx, theta);

    // Then, draw the highlighted chamber(s) on top
    // Note: The chamber visualization will be misaligned near the center due
    // to the geometry update, but is kept for the outer chambers.
    if (selectedChamber === 'all') {
        Object.values(chambers).forEach(def => drawChamber(ctx, def, theta));
    } else if (chambers[selectedChamber]) {
        drawChamber(ctx, chambers[selectedChamber], theta);
    }
}
