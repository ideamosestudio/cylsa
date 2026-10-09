import bpy
import json

def vector(values):
    return [round(float(value), 5) for value in values]

objects = []
for obj in bpy.data.objects:
    entry = {
        "name": obj.name,
        "type": obj.type,
        "parent": obj.parent.name if obj.parent else None,
        "location": vector(obj.location),
        "rotation": vector(obj.rotation_euler),
        "scale": vector(obj.scale),
    }
    if obj.type == "MESH":
        entry.update({
            "vertices": len(obj.data.vertices),
            "polygons": len(obj.data.polygons),
            "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
            "dimensions": vector(obj.dimensions),
        })
    objects.append(entry)

materials = []
for material in bpy.data.materials:
    materials.append({
        "name": material.name,
        "nodes": [node.bl_idname for node in material.node_tree.nodes] if material.use_nodes else [],
    })

images = []
for image in bpy.data.images:
    images.append({"name": image.name, "filepath": image.filepath, "size": list(image.size), "packed": image.packed_file is not None})

print("CYL_INSPECTION_BEGIN")
print(json.dumps({"objects": objects, "materials": materials, "images": images}, indent=2))
print("CYL_INSPECTION_END")
