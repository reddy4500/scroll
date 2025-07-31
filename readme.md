<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Scroll Compressor Visualizer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #4f46e5;
            cursor: pointer;
            border-radius: 50%;
        }
        .slider-track {
            width: 100%;
            height: 8px;
            cursor: pointer;
            background: #e5e7eb;
            border-radius: 9999px;
        }
    </style>
</head>
<body class="bg-gray-100 text-gray-800">

    <div class="flex flex-col lg:flex-row h-screen">
        <!-- Control Panel -->
        <div class="w-full lg:w-1/3 p-6 bg-white shadow-lg overflow-y-auto">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Scroll Compressor Analysis</h1>
            <p class="text-sm text-gray-500 mb-6">Based on Bell, et al. (2014). All volumes in cc.</p>

            <!-- Controls -->
            <div class="space-y-6">
                <div>
                    <label for="crankAngle" class="block text-sm font-medium text-gray-700">Crank Angle (&theta;): <span id="angleValue" class="font-bold text-indigo-600">0.00°</span></label>
                    <input type="range" id="crankAngle" min="0" max="360" value="0" step="0.1" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                </div>
                <div>
                    <label for="chamberSelect" class="block text-sm font-medium text-gray-700">Highlight Chamber</label>
                    <select id="chamberSelect" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="all">All Chambers</option>
                        <option value="s1">Suction 1 (s1)</option>
                        <option value="s2">Suction 2 (s2)</option>
                        <option value="c1_1">Compression 1.1 (c1,1)</option>
                        <option value="c2_1">Compression 2.1 (c2,1)</option>
                        <option value="c1_2">Compression 1.2 (c1,2)</option>
                        <option value="c2_2">Compression 2.2 (c2,2)</option>
                        <option value="d1">Discharge 1 (d1)</option>
                        <option value="d2">Discharge 2 (d2)</option>
                         <option value="none">None</option>
                    </select>
                </div>
            </div>

            <!-- Volume Display -->
            <div class="mt-8">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">Calculated Volumes</h2>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <table class="w-full text-sm text-left">
                        <thead class="text-xs text-gray-700 uppercase">
                            <tr>
                                <th class="py-2 px-2">Chamber</th>
                                <th class="py-2 px-2 text-right">Volume (cc)</th>
                            </tr>
                        </thead>
                        <tbody id="volumeTable" class="divide-y divide-gray-200">
                            <!-- Rows will be populated by JavaScript -->
                        </tbody>
                    </table>
                </div>
            </div>
             <div class="mt-6 text-xs text-gray-400">
                <p>Discharge begins at &theta;<sub>d</sub> = <span id="thetaD"></span>°</p>
            </div>
        </div>

        <!-- Visualizer -->
        <div class="flex-1 flex items-center justify-center p-6">
            <canvas id="scrollCanvas" class="bg-white rounded-xl shadow-md"></canvas>
        </div>
    </div>

    <script>
        // --- CONSTANTS AND INPUTS (from Table 3) ---
        const r_b = 0.0015288;
        const h = 0.00853840915200;
        const phi_i0 = 0.0;
        const phi_is = Math.PI;
        const phi_ie = 17.7195;
        const phi_o0 = -1.39626;
        const phi_os = 0.3;
        const phi_oe = 17.7195;
        const t_s = r_b * (phi_i0 - phi_o0);
        const r_o = r_b * Math.PI - t_s;
        const m3_to_cc = 1e6;

        // --- DOM ELEMENTS ---
        const canvas = document.getElementById('scrollCanvas');
        const ctx = canvas.getContext('2d');
        const angleSlider = document.getElementById('crankAngle');
        const angleValueSpan = document.getElementById('angleValue');
        const volumeTable = document.getElementById('volumeTable');
        const chamberSelect = document.getElementById('chamberSelect');
        const thetaDSpan = document.getElementById('thetaD');

        // --- GEOMETRY CALCULATION FUNCTIONS (Ported from Python) ---

        function getInvoluteCoords(phi, phi_0, scrollType, theta = 0) {
            let x, y;
            if (scrollType === 'fixed') {
                x = r_b * (Math.cos(phi) + (phi - phi_0) * Math.sin(phi));
                y = r_b * (Math.sin(phi) - (phi - phi_0) * Math.cos(phi));
            } else { // orbiting
                const Theta_shift = phi_ie - theta - Math.PI / 2;
                x = -r_b * (Math.cos(phi) + (phi - phi_0) * Math.sin(phi)) + r_o * Math.cos(Theta_shift);
                y = -r_b * (Math.sin(phi) - (phi - phi_0) * Math.cos(phi)) + r_o * Math.sin(Theta_shift);
            }
            return { x, y };
        }

        function Gr_f(phi, phi_0) {
            return (phi * r_b ** 2 / 6) * (phi ** 2 - 3 * phi * phi_0 + 3 * phi_0 ** 2);
        }

        function Gr_o(phi, phi_0, theta) {
            const Theta_shift = phi_ie - theta - Math.PI / 2;
            const term1 = phi ** 3 * r_b - 3 * phi ** 2 * phi_0 * r_b + 3 * phi * phi_0 ** 2 * r_b;
            const term2 = 3 * (phi - phi_0) * r_o * Math.cos(phi - Theta_shift);
            const term3 = -3 * r_o * Math.sin(phi - Theta_shift);
            return (r_b / 6) * (term1 + term2 + term3);
        }

        function lineAreaContribution(p1, p2) {
            return 0.5 * (p1.x * p2.y - p2.x * p1.y);
        }

        function getPhiSsa(theta) {
            const A = phi_i0 - phi_ie + (r_o / r_b) * Math.cos(theta);
            const B = 1 + (r_o / r_b) * Math.sin(theta);
            const C = -1;
            let S_squared = A ** 2 + B ** 2 - C ** 2;
            if (S_squared < 0) S_squared = 0;
            const S = Math.sqrt(S_squared);
            const u = (A + S) / (B - C);
            const delta = 2 * Math.atan(u);
            return phi_oe - Math.PI + delta;
        }

        function calculateChamberVolume(chamberDef, theta) {
            const { outer_scroll_type, phi_O_max_f, phi_O_min_f, phi_O_0, inner_scroll_type, phi_I_max_f, phi_I_min_f, phi_I_0 } = chamberDef;
            
            const phi_O_max = phi_O_max_f(theta);
            const phi_O_min = phi_O_min_f(theta);
            const phi_I_max = phi_I_max_f(theta);
            const phi_I_min = phi_I_min_f(theta);

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
            return h * total_area;
        }
        
        // --- CHAMBER DEFINITIONS (from Table 1) ---
        const Nc_max = Math.floor((phi_oe - phi_os - Math.PI) / (2 * Math.PI));
        const theta_d = phi_oe - phi_os - 2 * Math.PI * Nc_max - Math.PI;
        
        const chambers = {
            's1': {
                outer_scroll_type: 'fixed', phi_O_max_f: t => phi_ie, phi_O_min_f: t => phi_is - t, phi_O_0: phi_i0,
                inner_scroll_type: 'orbiting', phi_I_max_f: t => getPhiSsa(t), phi_I_min_f: t => phi_oe - t - Math.PI, phi_I_0: phi_o0,
                color: 'rgba(59, 130, 246, 0.6)'
            },
            's2': {
                outer_scroll_type: 'orbiting', phi_O_max_f: t => phi_ie, phi_O_min_f: t => phi_is - t, phi_O_0: phi_i0,
                inner_scroll_type: 'fixed', phi_I_max_f: t => getPhiSsa(t), phi_I_min_f: t => phi_oe - t - Math.PI, phi_I_0: phi_o0,
                color: 'rgba(34, 197, 94, 0.6)'
            },
            'c1_1': {
                outer_scroll_type: 'fixed', phi_O_max_f: t => phi_ie - t, phi_O_min_f: t => phi_ie - t - 2 * Math.PI, phi_O_0: phi_i0,
                inner_scroll_type: 'orbiting', phi_I_max_f: t => phi_oe - t - Math.PI, phi_I_min_f: t => phi_oe - t - 3 * Math.PI, phi_I_0: phi_o0,
                color: 'rgba(239, 68, 68, 0.6)'
            },
            'c2_1': {
                outer_scroll_type: 'orbiting', phi_O_max_f: t => phi_ie - t, phi_O_min_f: t => phi_ie - t - 2 * Math.PI, phi_O_0: phi_i0,
                inner_scroll_type: 'fixed', phi_I_max_f: t => phi_oe - t - Math.PI, phi_I_min_f: t => phi_oe - t - 3 * Math.PI, phi_I_0: phi_o0,
                color: 'rgba(249, 115, 22, 0.6)'
            },
            'c1_2': {
                outer_scroll_type: 'fixed', phi_O_max_f: t => phi_ie - t - 2 * Math.PI, phi_O_min_f: t => phi_ie - t - 4 * Math.PI, phi_O_0: phi_i0,
                inner_scroll_type: 'orbiting', phi_I_max_f: t => phi_oe - t - 3 * Math.PI, phi_I_min_f: t => phi_oe - t - 5 * Math.PI, phi_I_0: phi_o0,
                color: 'rgba(217, 70, 239, 0.6)'
            },
            'c2_2': {
                outer_scroll_type: 'orbiting', phi_O_max_f: t => phi_ie - t - 2 * Math.PI, phi_O_min_f: t => phi_ie - t - 4 * Math.PI, phi_O_0: phi_i0,
                inner_scroll_type: 'fixed', phi_I_max_f: t => phi_oe - t - 3 * Math.PI, phi_I_min_f: t => phi_oe - t - 5 * Math.PI, phi_I_0: phi_o0,
                color: 'rgba(168, 85, 247, 0.6)'
            },
            'd1': {
                outer_scroll_type: 'fixed', phi_O_max_f: t => phi_ie - t - 2 * Math.PI * Nc_max, phi_O_min_f: t => phi_os + Math.PI, phi_O_0: phi_i0,
                inner_scroll_type: 'orbiting', phi_I_max_f: t => phi_oe - t - Math.PI - 2 * Math.PI * Nc_max, phi_I_min_f: t => phi_os, phi_I_0: phi_o0,
                color: 'rgba(13, 148, 136, 0.6)'
            },
            'd2': {
                outer_scroll_type: 'orbiting', phi_O_max_f: t => phi_ie - t - 2 * Math.PI * Nc_max, phi_O_min_f: t => phi_os + Math.PI, phi_O_0: phi_i0,
                inner_scroll_type: 'fixed', phi_I_max_f: t => phi_oe - t - Math.PI - 2 * Math.PI * Nc_max, phi_I_min_f: t => phi_os, phi_I_0: phi_o0,
                color: 'rgba(2, 132, 199, 0.6)'
            }
        };


        // --- DRAWING FUNCTIONS ---
        let scale, centerX, centerY;

        function setupCanvas() {
            const size = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.9);
            canvas.width = size;
            canvas.height = size;
            const max_dim = r_b * (1 + phi_ie);
            scale = size / (max_dim * 2.5);
            centerX = canvas.width / 2;
            centerY = canvas.height / 2;
        }

        function drawInvolute(phi_start, phi_end, phi_0, scrollType, theta, color, lineWidth) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            const steps = 200;
            for (let i = 0; i <= steps; i++) {
                const phi = phi_start + (phi_end - phi_start) * i / steps;
                const { x, y } = getInvoluteCoords(phi, phi_0, scrollType, theta);
                const screenX = centerX + x * scale;
                const screenY = centerY - y * scale; // Invert Y for canvas coordinates
                if (i === 0) {
                    ctx.moveTo(screenX, screenY);
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            }
            ctx.stroke();
        }
        
        function drawDischarge(scrollType, theta, color, lineWidth) {
            // Simplified for visualization: connect start points with a line
            const p_is = getInvoluteCoords(phi_is, phi_i0, scrollType, theta);
            const p_os = getInvoluteCoords(phi_os, phi_o0, scrollType, theta);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.moveTo(centerX + p_is.x * scale, centerY - p_is.y * scale);
            ctx.lineTo(centerX + p_os.x * scale, centerY - p_os.y * scale);
            ctx.stroke();
        }

        function drawChamber(chamberDef, theta) {
            const { outer_scroll_type, phi_O_max_f, phi_O_min_f, phi_O_0, inner_scroll_type, phi_I_max_f, phi_I_min_f, phi_I_0, color } = chamberDef;
            
            const phi_O_max = phi_O_max_f(theta);
            const phi_O_min = phi_O_min_f(theta);
            const phi_I_max = phi_I_max_f(theta);
            const phi_I_min = phi_I_min_f(theta);

            ctx.beginPath();
            ctx.fillStyle = color;

            const steps = 50;
            // Trace outer involute
            for (let i = 0; i <= steps; i++) {
                const phi = phi_O_min + (phi_O_max - phi_O_min) * i / steps;
                const { x, y } = getInvoluteCoords(phi, phi_O_0, outer_scroll_type, theta);
                const screenX = centerX + x * scale;
                const screenY = centerY - y * scale;
                if (i === 0) ctx.moveTo(screenX, screenY);
                else ctx.lineTo(screenX, screenY);
            }
            // Trace inner involute (in reverse)
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

        function drawScene(theta) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw highlighted chamber(s) first (so they are in the back)
            const selectedChamber = chamberSelect.value;
            if (selectedChamber === 'all') {
                Object.values(chambers).forEach(def => drawChamber(def, theta));
            } else if (chambers[selectedChamber]) {
                drawChamber(chambers[selectedChamber], theta);
            }

            // Draw fixed scroll (gray)
            drawInvolute(phi_is, phi_ie, phi_i0, 'fixed', 0, '#4b5563', 3);
            drawInvolute(phi_os, phi_oe, phi_o0, 'fixed', 0, '#4b5563', 3);
            drawDischarge('fixed', 0, '#4b5563', 3);

            // Draw orbiting scroll (red)
            drawInvolute(phi_is, phi_ie, phi_i0, 'orbiting', theta, '#ef4444', 3);
            drawInvolute(phi_os, phi_oe, phi_o0, 'orbiting', theta, '#ef4444', 3);
            drawDischarge('orbiting', theta, '#ef4444', 3);
        }

        // --- UPDATE AND EVENT HANDLING ---

        function update(angleDegrees) {
            const theta = angleDegrees * Math.PI / 180;
            angleValueSpan.textContent = `${angleDegrees.toFixed(2)}°`;

            let tableHTML = '';
            Object.keys(chambers).forEach(name => {
                const volume_m3 = calculateChamberVolume(chambers[name], theta);
                let volume_cc = volume_m3 * m3_to_cc;
                if (Math.abs(volume_cc) < 1e-9) volume_cc = 0;
                tableHTML += `
                    <tr class="hover:bg-gray-100">
                        <td class="py-2 px-2 font-medium">${name}</td>
                        <td class="py-2 px-2 text-right">${volume_cc.toFixed(2)}</td>
                    </tr>`;
            });
            volumeTable.innerHTML = tableHTML;
            
            drawScene(theta);
        }

        // --- INITIALIZATION ---
        window.addEventListener('resize', () => {
            setupCanvas();
            update(parseFloat(angleSlider.value));
        });
        
        angleSlider.addEventListener('input', (e) => update(parseFloat(e.target.value)));
        chamberSelect.addEventListener('change', () => update(parseFloat(angleSlider.value)));

        setupCanvas();
        thetaDSpan.textContent = (theta_d * 180 / Math.PI).toFixed(2);
        update(0); // Initial call
    </script>
</body>
</html>
