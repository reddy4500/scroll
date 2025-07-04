# Input parameters
cooling_capacity_W = 2000          # W
h1_kJ_kg = 421.3                    # kJ/kg (inlet)
h4_kJ_kg = 264.2                    # kJ/kg (after expansion)
vol_efficiency = 0.88             # volumetric efficiency
rpm = 5500                          # RPM
rho_s = 13.14                       # kg/m³ (R134a vapor at 2.17 bar)

# Convert to rev/s
rev_per_sec = rpm / 60.0

# Step 1: Mass flow rate
delta_h = h1_kJ_kg - h4_kJ_kg       # in kJ/kg
m_dot = cooling_capacity_W / (delta_h * 1000)  # kg/s

# Step 2: Calculate required displacement
V_disp_m3_per_rev = m_dot / (rho_s * vol_efficiency * rev_per_sec)
V_disp_cc = V_disp_m3_per_rev * 1e6  # convert m³/rev to cc/rev

# Output
print(f"Required displacement volume = {V_disp_cc:.2f} cc/rev")