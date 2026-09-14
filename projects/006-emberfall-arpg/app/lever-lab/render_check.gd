extends SceneTree
## Reproducible rendering fixture, not a human playtest or a learning assessment.
func _initialize() -> void:
	_run.call_deferred()

func _run() -> void:
	var lab = load("res://lab.tscn").instantiate()
	root.add_child(lab)
	await process_frame
	lab.set_physics_process(false)
	lab.model.configure({"pivot":-1.0})
	for i in range(360):
		lab.model.tick()
	lab.save_a()
	lab.initial_example()
	for i in range(360):
		lab.model.tick()
	lab.paused = true
	lab._refresh()
	await process_frame
	await lab._capture()
	var path: String = OS.get_user_data_dir().path_join("captures/lever-lab-live.png")
	var img = Image.load_from_file(path)
	if img == null or img.is_empty():
		push_error("Screenshot missing")
		quit(1)
		return
	print("CAPTURE VERIFIED ", img.get_width(), "x", img.get_height(), " ", path)
	quit()
