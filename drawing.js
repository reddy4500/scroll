import * as C from './constants.js';
import { getInvoluteCoords, chambers } from './geometry.js';

let scale, centerX, centerY;

/**
 * Sets up the canvas dimensions and scaling factor.
 * @param {HTMLCanvasElement} canvas - The canvas element.
 */
export function setupCanvas(canvas) {
    const size = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.9);
    canvas.width = size;
    canvas.height = size;
    const max_dim = C.r_b * (1 + C.phi_ie);
    scale = size / (max_dim * 2.5);
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

/**
 * Draws a complete, solid scroll wrap.
 */
function drawScrollWrap(ctx, scrollType, theta, color) {
    ctx.beginPath();
    const steps = 200;

    for (let i = 0; i <= steps; i++) {
        const phi = C.phi_os + (C.phi_oe - C.phi_os) * i / steps;
        const { x, y } = getInvoluteCoords(phi, C.phi_o0, scrollType, theta);
        const screenX = centerX + x * scale;
        const screenY = centerY - y * scale;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
    }
    
    const p_oe = getInvoluteCoords(C.phi_oe, C.phi_o0, scrollType, theta);
    const p_ie = getInvoluteCoords(C.phi_ie, C.phi_i0, scrollType, theta);
    ctx.lineTo(centerX + p_ie.x * scale, centerY - p_ie.y * scale);

    for (let i = steps; i >= 0; i--) {
        const phi = C.phi_is + (C.phi_ie - C.phi_is) * i / steps;
        const { x, y } = getInvoluteCoords(phi, C.phi_i0, scrollType, theta);
        const screenX = centerX + x * scale;
        const screenY = centerY - y * scale;
        ctx.lineTo(screenX, screenY);
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.stroke();
}

/**
 * Fills a specific chamber with its designated color.
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

    for (let i = 0; i <= steps; i++) {
        const phi = phi_O_min + (phi_O_max - phi_O_min) * i / steps;
        const { x, y } = getInvoluteCoords(phi, phi_O_0, outer_scroll_type, theta);
        const screenX = centerX + x * scale;
        const screenY = centerY - y * scale;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
    }

    for (let i = steps; i >= 0; i--) {
        const phi = phi_I_min + (phi_I_max - phi_I_min) * i / steps;
        const { x, y } = getInvoluteCoords(phi, phi_I_0, inner_scroll_type, theta);
        const screenX = centerX + x * scale;
        const screenY = centerY - y * scale;
        ctx.lineTo(screenX, screenY);
    }
    ctx.closePath();
    ctx.fill();
}

/**
 * Draws the entire scene on the canvas.
 */
export function drawScene(ctx, theta, selectedChamber) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    if (selectedChamber === 'all') {
        Object.values(chambers).forEach(def => drawChamber(ctx, def, theta));
    } else if (chambers[selectedChamber]) {
        drawChamber(ctx, chambers[selectedChamber], theta);
    }

    drawScrollWrap(ctx, 'fixed', 0, '#d1d5db');
    drawScrollWrap(ctx, 'orbiting', theta, '#fca5a5');
}
