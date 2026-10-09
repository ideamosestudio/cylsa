import bpy
import os

source_dir = os.path.dirname(bpy.data.filepath)
project_dir = os.path.abspath(os.path.join(source_dir, ".."))
output_dir = os.path.join(project_dir, "public", "models")
os.makedirs(output_dir, exist_ok=True)

for obj in list(bpy.data.objects):
    if obj.type != "MESH":
        bpy.data.objects.remove(obj, do_unlink=True)

for obj in bpy.context.scene.objects:
    obj.select_set(False)

material_specs = {
    "tire": {
        "name": "CYL_Rubber",
        "base": (0.018, 0.02, 0.023, 1.0),
        "metallic": 0.0,
        "roughness": 0.56,
    },
    "rim": {
        "name": "CYL_Alloy",
        "base": (0.15, 0.17, 0.19, 1.0),
        "metallic": 0.92,
        "roughness": 0.2,
    },
}

for source_name, spec in material_specs.items():
    obj = bpy.data.objects.get(source_name)
    if obj is None:
        raise RuntimeError(f"Missing required mesh: {source_name}")

    obj.name = "Tire" if source_name == "tire" else "Rim"
    obj.data.name = f"{obj.name}_Geometry"
    for modifier in obj.modifiers:
        if modifier.type == "SUBSURF":
            modifier.levels = 0 if source_name == "tire" else 1
            modifier.render_levels = modifier.levels
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)

    material = bpy.data.materials.new(spec["name"])
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = spec["base"]
    bsdf.inputs["Metallic"].default_value = spec["metallic"]
    bsdf.inputs["Roughness"].default_value = spec["roughness"]
    if source_name == "tire":
        bsdf.inputs["Coat Weight"].default_value = 0.12
        bsdf.inputs["Coat Roughness"].default_value = 0.5
    obj.data.materials.clear()
    obj.data.materials.append(material)
    obj.select_set(True)

bpy.context.scene.render.engine = "BLENDER_EEVEE"
bpy.context.scene.world.color = (0.004, 0.004, 0.006)

bpy.ops.export_scene.gltf(
    filepath=os.path.join(output_dir, "cyl-wheel.glb"),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_materials="EXPORT",
    export_cameras=False,
    export_lights=False,
    export_yup=True,
)

print(f"CYL_EXPORT={os.path.join(output_dir, 'cyl-wheel.glb')}")
