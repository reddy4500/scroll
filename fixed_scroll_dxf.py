import numpy as np
import matplotlib.pyplot as plt
import math as m
import ezdxf

# Base parameters
r = 1.58340
b = -1.39626
theta_rad = np.linspace(0, 17.7159, 1000)

# Lists for both curves
xarr1, yarr1, zarr1 = [], [], []  # With offset 'b'
xarr2, yarr2, zarr2 = [], [], []  # Without offset 'b'

# First curve: with offset b
for a in theta_rad:
    x = r * (m.cos(a) + ((a - b) * m.sin(a)))
    y = r * (m.sin(a) - ((a - b) * m.cos(a)))
    z = 0
    xarr1.append(x)
    yarr1.append(y)
    zarr1.append(z)

# Second curve: without offset
for a in theta_rad:
    x = r * (m.cos(a) + (a * m.sin(a)))
    y = r * (m.sin(a) - (a * m.cos(a)))
    z = 0
    xarr2.append(x)
    yarr2.append(y)
    zarr2.append(z)

# Plot both curves
plt.plot(xarr1, yarr1, label="Curve with offset b", linewidth=2)
plt.plot(xarr2, yarr2, label="Curve without offset", linestyle='--')
plt.axis("equal")
plt.title("Combined Curves")
plt.xlabel("X")
plt.ylabel("Y")
plt.grid(True)
plt.legend()
plt.show()

# Save both curves to a DXF file
doc = ezdxf.new()
msp = doc.modelspace()

# First curve polyline (with offset)
points1 = list(zip(xarr1, yarr1))
msp.add_lwpolyline(points1)

# Second curve polyline (without offset)
points2 = list(zip(xarr2, yarr2))
msp.add_lwpolyline(points2)

dxf_filename = "combined_curves.dxf"
doc.saveas(dxf_filename)
print("DXF file saved successfully:", dxf_filename)

# Also export to text file
points_file = "creo.txt"
with open(points_file, "w") as file:
    for x, y, z in zip(xarr1, yarr1, zarr1):
        file.write("{:.6f} {:.6f} {:.6f}\n".format(x, y, z))
print("Points file created successfully:", points_file)
