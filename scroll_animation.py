import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, PillowWriter

# Scroll Geometry Constants (from Bell 2010)
rb = 0.00158340            # Base circle radius (m)
ts = 0.00221084      # Scroll thickness (m)
fi0 = 0                 # Inner involute initial angle
fo0 = -1.39626          # Outer involute initial angle
fie = 17.7195           # Inner involute end angle
foe = 17.7195           # Outer involute end angle
ro = rb * np.pi - ts    # Orbiting radius

# Involute coordinate generator
def involute_coordinates(rb, f0, f):
    r = rb * (f - f0)
    x = rb * np.cos(f) + r * np.sin(f)
    y = rb * np.sin(f) - r * np.cos(f)
    return x, y

# Generate fixed scroll involutes (rotated by 180°)
phi_inner = np.linspace(fi0, fie, 1000)
phi_outer = np.linspace(fo0, foe, 1000)

fixed_inner_x, fixed_inner_y = zip(*[(-involute_coordinates(rb, fi0, f)[0], -involute_coordinates(rb, fi0, f)[1]) for f in phi_inner])
fixed_outer_x, fixed_outer_y = zip(*[(-involute_coordinates(rb, fo0, f)[0], -involute_coordinates(rb, fo0, f)[1]) for f in phi_outer])

# Setup plot
fig, ax = plt.subplots(figsize=(8, 8))
ax.set_xlim(-0.02, 0.02)
ax.set_ylim(-0.02, 0.02)
ax.set_aspect('equal', adjustable='box')
ax.set_xlabel("X (m)")
ax.set_ylabel("Y (m)")
ax.grid(True)

# Plot fixed scroll as a filled shape
fixed_patch = ax.fill(fixed_inner_x + fixed_outer_x[::-1],
                      fixed_inner_y + fixed_outer_y[::-1],
                      color='blue', alpha=0.5, label='Fixed Scroll')[0]

# Initialize orbiting scroll patch (to be updated)
orbiting_patch = ax.fill([], [], color='red', alpha=0.5, label='Orbiting Scroll')[0]

# Animation update function (Anti-clockwise rotation)
def update(frame):
    theta = -frame * np.pi / 180         # Crank angle in radians (anti-clockwise)
    Q = fie - theta - np.pi / 2          # Orbiting scroll phase shift
    x_shift = ro * np.cos(theta)         # Orbiting translation (x)
    y_shift = ro * np.sin(theta)         # Orbiting translation (y)

    orbiting_inner_x, orbiting_inner_y = [], []
    orbiting_outer_x, orbiting_outer_y = [], []

    for f in phi_inner:
        x, y = involute_coordinates(rb, fi0, f)
        orbiting_inner_x.append(x + x_shift)
        orbiting_inner_y.append(y + y_shift)

    for f in phi_outer:
        x, y = involute_coordinates(rb, fo0, f)
        orbiting_outer_x.append(x + x_shift)
        orbiting_outer_y.append(y + y_shift)

    full_x = orbiting_inner_x + orbiting_outer_x[::-1]
    full_y = orbiting_inner_y + orbiting_outer_y[::-1]
    orbiting_patch.set_xy(np.column_stack((full_x, full_y)))

    return orbiting_patch,

# Create animation
frames = 360
ani = FuncAnimation(fig, update, frames=frames, interval=20, blit=True)

# Save the animation
try:
    ani.save("scroll_compressor_anticlockwise.gif", writer="imagemagick")
except Exception as e:
    print(f"ImageMagick error: {e}. Falling back to PillowWriter.")
    ani.save("scroll_compressor_anticlockwise.gif", writer=PillowWriter(fps=30))

plt.legend(loc='upper right')
plt.show()

