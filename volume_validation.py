import numpy as np
import pandas as pd

# Crank angles (in radians)
theta_vals = np.array([
    0.0, 0.7853982, 1.570796, 2.356194,
    3.141593, 3.926991, 4.712389, 5.497787, 6.283185
])

# Volume function (s1 component)
def V_s1(theta):
    return 50e-6 * (1 - np.cos(theta)) / 2

# Derivative of volume
def dVdtheta_s1(theta):
    return 50e-6 * (np.sin(theta)) / 2

# Centroid functions
def x_centroid_s1(theta):
    return -0.05 * np.sin(theta)

def y_centroid_s1(theta):
    return 0.0125 * np.sin(theta)

# Generate DataFrame
data = {
    "theta [rad]": theta_vals,
    "V_s1 [m³]": V_s1(theta_vals),
    "dV/dθ_s1 [m³/rad]": dVdtheta_s1(theta_vals),
    "x̄_s1 [m]": x_centroid_s1(theta_vals),
    "ȳ_s1 [m]": y_centroid_s1(theta_vals)
}

df = pd.DataFrame(data)
print(df.round(8))
