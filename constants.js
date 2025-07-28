// --- CONSTANTS AND INPUTS (from Table 3 of Bell, et al., 2014) ---

// Base circle radius (m)
export const r_b = 0.00286479; 
// Scroll height (m)
export const h = 0.040536;     
// Inner involute initial angle (rad)
export const phi_i0 = 0.0;       
// Inner involute start angle (rad)
export const phi_is = Math.PI;   
// Inner involute end angle (rad)
export const phi_ie = 17.7195;   
// Outer involute initial angle (rad)
export const phi_o0 = -1.39626;  
// Outer involute start angle (rad)
export const phi_os = 0.3;       
// Outer involute end angle (rad)
export const phi_oe = 17.7195;   
// Scroll thickness (m)
export const t_s = r_b * (phi_i0 - phi_o0); 
// Orbiting radius (m)
export const r_o = r_b * Math.PI - t_s;     
// Conversion factor from m^3 to cm^3 (cc)
export const m3_to_cc = 1e6;     

