// --- CONSTANTS AND INPUTS (from Table 3 of Bell, et al., 2014 and Python script) ---

// Base circle radius (m)
export const r_b = 0.00286479; 
// Scroll height (m)
export const h = 0.040536;     
// Inner involute initial angle (rad)
export const phi_i0 = 0.0;       
// Inner involute start angle (rad) -- Note: This is now determined by the tangent point
// export const phi_is = Math.PI; // This is no longer a fixed value
// Inner involute end angle (rad)
export const phi_ie = 17.7195;   
// Outer involute initial angle (rad)
export const phi_o0 = -1.39626;  
// Outer involute start angle (rad) -- Note: This is now determined by the tangent point
// export const phi_os = 0.3; // This is no longer a fixed value
// Outer involute end angle (rad)
export const phi_oe = 17.7195;   
// Scroll thickness (m)
export const t_s = r_b * (phi_i0 - phi_o0); 
// Orbiting radius (m)
export const r_o = r_b * Math.PI - t_s;     
// Conversion factor from m^3 to cm^3 (cc)
export const m3_to_cc = 1e6;     

// --- NEW: Discharge Geometry Constants (from Python script logic) ---
// These values would typically come from your design data (e.g., the Excel sheet).
// The Python script enforces a "perfect meshing" condition. We will do the same.

// Base parameters for the second arc (outer wrap of the fixed scroll)
export const ra2 = 0.0015; // Radius in meters (e.g., 1.5mm)
export const xa2_fixed_center = 0.001; // X-center in meters (e.g., 1.0mm)
export const ya2_fixed_center = 0.001; // Y-center in meters (e.g., 1.0mm)

// Corrected parameters for the first arc (inner wrap) based on perfect-meshing condition
export const ra1 = ra2 + r_o; // (ra1 = ra2 + orbiting_radius)
export const xa1_fixed_center = -xa2_fixed_center; // Mirrored center
export const ya1_fixed_center = -ya2_fixed_center; // Mirrored center

