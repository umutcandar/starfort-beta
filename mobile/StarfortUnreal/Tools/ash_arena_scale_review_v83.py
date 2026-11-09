#!/usr/bin/env python3
"""Real STARFORT v79 original Ash Arena GLB import size guard for UE 5.8.

The GLB was authored in meters (terrain spans 23m). Depending on the
Unreal Interchange import settings, imported StaticMeshes may be converted
to centimeters automatically, or remain in unconverted GLB world units.
Never place an arena 100x too small (or 100x too large) under 3 UE heroes.
Choose one uniform actor scale from real imported mesh bounds; fail closed
rather than guess on unknown or mixed-scale imports.
"""
import math

MIN_PIECES=70
METERS_MIN=18.0
METERS_MAX=30.0
CENTIMETERS_MIN=1800.0
CENTIMETERS_MAX=3000.0


def imported_arena_uniform_scale(meshes):
    if len(meshes)<MIN_PIECES:
        raise ValueError("Real original GLB must yield at least 70 individual StaticMeshes")
    dimensions=[]
    for mesh in meshes:
        # StaticMesh.get_bounds() returns a real Unreal BoxSphereBounds.
        bounds=mesh.get_bounds()
        extent=bounds.box_extent
        width=2.0*max(abs(float(extent.x)),abs(float(extent.y)))
        if not math.isfinite(width) or width<0:
            raise ValueError("Bad real UE geometry bounds: cannot choose GLB scale")
        dimensions.append(width)
    longest=max(dimensions)
    if METERS_MIN<=longest<=METERS_MAX:
        # GLB coordinates remain meters: create 23m *100 = 2300 Unreal cm.
        return 100.0
    if CENTIMETERS_MIN<=longest<=CENTIMETERS_MAX:
        # Interchange already converted 23m into Unreal's centimeter units.
        return 1.0
    raise ValueError(
        "Unexpected original arena bounds %.2f: need genuine ~23m / ~2300cm "
        "terrain; do not stage geometry at arbitrary size" % longest
    )
