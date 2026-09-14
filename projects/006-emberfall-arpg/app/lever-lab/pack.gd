extends SceneTree

func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("res://dist")
	var packer = PCKPacker.new()
	var error = packer.pck_start("res://dist/LeverLab.pck")
	if error != OK:
		push_error("Could not create pack: %d" % error)
		quit(1)
		return
	for file in ["project.godot", "lab.tscn", "lab.gd", "model.gd"]:
		error = packer.add_file("res://" + file, "res://" + file)
		if error != OK:
			push_error("Could not add " + file)
			quit(1)
			return
	error = packer.flush()
	print("Pack result: ", error)
	quit(0 if error == OK else 1)
