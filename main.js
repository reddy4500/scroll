import * as C from './constants.js';
import { chambers, calculateChamberVolume, theta_d } from './geometry.js';
import { setupCanvas, drawScene } from './drawing.js';

// --- DOM ELEMENTS ---
const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');
const angleSlider = document.getElementById('crankAngle');
const angleValueSpan = document.getElementById('angleValue');
const volumeTable = document.getElementById('volumeTable');
const chamberSelect = document.getElementById('chamberSelect');
const thetaDSpan = document.getElementById('thetaD');

/**
 * Main update function. Called when the slider value changes.
 */
function update(angleDegrees) {
    const theta = angleDegrees * Math.PI / 180;
    angleValueSpan.textContent = `${angleDegrees.toFixed(2)}°`;

    // Update the volume table
    let tableHTML = '';
    Object.keys(chambers).forEach(name => {
        const volume_m3 = calculateChamberVolume(chambers[name], theta);
        let volume_cc = volume_m3 * C.m3_to_cc;
        if (Math.abs(volume_cc) < 1e-9 || volume_cc < 0) {
            volume_cc = 0;
        }
        tableHTML += `
            <tr class="hover:bg-gray-100">
                <td class="py-2 px-2 font-medium">${name}</td>
                <td class="py-2 px-2 text-right">${volume_cc.toFixed(2)}</td>
            </tr>`;
    });
    volumeTable.innerHTML = tableHTML;
    
    // Redraw the canvas
    drawScene(ctx, theta, chamberSelect.value);
}

// --- INITIALIZATION ---
function init() {
    // Set up event listeners
    angleSlider.addEventListener('input', (e) => update(parseFloat(e.target.value)));
    chamberSelect.addEventListener('change', () => update(parseFloat(angleSlider.value)));
    window.addEventListener('resize', () => {
        setupCanvas(canvas);
        update(parseFloat(angleSlider.value));
    });

    // Initial setup
    setupCanvas(canvas);
    thetaDSpan.textContent = (theta_d * 180 / Math.PI).toFixed(2);
    update(0); // Initial call to draw the scene at 0 degrees
}

// Run the application
init();
