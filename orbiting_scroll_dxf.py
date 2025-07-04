import numpy as np
import matplotlib.pyplot as plt
import math as m
import ezdxf

def generate_curve(r, b, d, n_deg, label):
    theta_rad = np.linspace(0, 17.7159, 1000)
    xarr = []
    yarr = []
    for a in theta_rad:
        x = -r * (m.cos(a) + ((a - b) * m.sin(a))) + d * m.cos(np.radians(n_deg))
        y = -r * (m.sin(a) - ((a - b) * m.cos(a))) + d * m.sin(np.radians(n_deg))
        xarr.append(x)
        yarr.append(y)
    return xarr, yarr, label

# Curve 1
r1, b1, d1, n1 = 2.86479, 0, 5, -180
x1, y1, label1 = generate_curve(r1, b1, d1, n1, "Curve1")

# Curve 2
r2, b2, d2, n2 = 2.86479, -1.39626, 5, -180
x2, y2, label2 = generate_curve(r2, b2, d2, n2, "Curve2")

# Plot both curves
plt.plot(x1, y1, label=label1)
plt.plot(x2, y2, label=label2)
plt.axis("equal")
plt.title("Two Curves")
plt.xlabel("X")
plt.ylabel("Y")
plt.grid(True)
plt.legend()
plt.show()

# DXF export of both curves
doc = ezdxf.new()
msp = doc.modelspace()

# Add first curve to DXF
for i in range(len(x1) - 1):
    msp.add_line((x1[i], y1[i]), (x1[i + 1], y1[i + 1]))

# Add second curve to DXF
for i in range(len(x2) - 1):
    msp.add_line((x2[i], y2[i]), (x2[i + 1], y2[i + 1]))

doc.saveas("both_curves.dxf")
print("DXF with two curves saved successfully as 'both_curves.dxf'")
