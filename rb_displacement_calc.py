import numpy as np

# Given constants
V_final = 12  # Final volume in cc
V_disp_desired = V_final / 2  # Desired displaced volume (half of the final volume)
fi0 = 0  # Inner involute initial angle
fo0 = -1.39626  # Outer involute initial angle
fie = 17.7195  # Inner involute end angle
foe = 17.7195  # Outer involute end angle
thickness_to_height_ratio = 1 / 10  # ts/h = 1/10

# Iterate over base radius (rb) from 0 to 4 mm
rb_min = 0
rb_max = 0.004  # 4 mm converted to meters
rb_step = 0.0000001  # Step size for rb (can be adjusted for precision)

found_solution = False  # Flag to indicate if a solution is found

for rb in np.arange(rb_min, rb_max, rb_step):
    # Step 1: Calculate thickness (ts)
    ts = rb * (fi0 - fo0)  # Thickness based on base radius and angle difference

    # Step 2: Calculate height (h)
    h = 3.6 * ts  # Height based on thickness (ts/h = 1/10)

    # Step 3: Calculate orbiting radius (ro)
    ro = rb * np.pi - ts  # Orbiting radius

    # Step 4: Calculate displaced volume (V_disp)
    V_disp_calculated = -np.pi * h * rb * ro * (3 * np.pi - 2 * fie + fi0 + fo0)

    # Debugging: Print intermediate values
    print(
        f"rb: {rb:.8f} m, ts: {ts:.8f} m, h: {h:.8f} m, ro: {ro:.8f} m, V_disp: {V_disp_calculated * 1e6:.2f} cc"
    )

    # Step 5: Check if the calculated displaced volume matches the desired value
    if np.isclose(V_disp_calculated * 1e6, V_disp_desired, atol=1e-3):
        # Output the results
        print("\nSolution Found:")
        print(f"Base Radius (rb): {rb:.8f} m")
        print(f"Thickness (ts): {ts:.8f} m")
        print(f"Height (h): {h:.8f} m")
        print(f"Orbiting Radius (ro): {ro:.8f} m")
        print(f"Displaced Volume (V_disp): {V_disp_calculated * 1e6:.2f} cc")
        found_solution = True
        break

if not found_solution:
    print("No solution found within the specified range of base radii.")
