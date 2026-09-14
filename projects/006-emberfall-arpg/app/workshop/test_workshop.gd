extends SceneTree

const Lever = preload("res://lever.gd")
var passed = 0
var failed = 0
var game: Node3D

func _initialize() -> void:
	_run.call_deferred()

func check(condition: bool, label: String) -> void:
	if condition:
		passed += 1
		print("PASS ", label)
	else:
		failed += 1
		push_error("FAIL " + label)

func simulate(l, duration: float, force: bool, position: float = 3.2) -> void:
	for i in range(int(duration * 60)):
		l.tick(1.0 / 60, force, position)

func _run() -> void:
	var l = Lever.new()
	simulate(l, 2, true)
	check(l.height() < 0.001, "full load cannot be lifted from central fulcrum")
	l.set_pivot(-1.5)
	simulate(l, 2, true)
	check(l.height() > 0.22, "moving fulcrum changes mechanical outcome")
	check(not l.set_pivot(0), "loaded moving beam cannot relocate its support")
	simulate(l, 2, false)
	check(l.height() < 0.001, "release returns unsupported load to rest")
	check(not l.brace(), "cannot repair without lifting")
	l.reset()
	l.count = 2
	simulate(l, 2, true)
	check(l.height() > 0.22, "unloading four crates supplies a second solution")
	check(l.brace(), "support can be placed after physical clearance")
	var supported_height = l.height()
	simulate(l, 2, false)
	check(is_equal_approx(l.height(), supported_height), "supported load remains held after release")
	l.reset()
	l.count = 2
	simulate(l, 2, true, 0.5)
	check(l.height() < 0.001, "pressing near the pivot supplies less torque")
	l.reset()
	l.count = 0
	simulate(l, 2, false)
	check(l.height() < 0.001, "empty rack still requires a force")
	game = load("res://workshop.tscn").instantiate()
	root.add_child(game)
	await frames(8)
	check(not game.can_press(), "force cannot be applied remotely")
	var before: Dictionary = game.snapshot()
	check(not game.restore({"version": 1, "crates": []}), "incomplete saves are rejected")
	check(game.attached_count() == 6, "invalid restore does not mutate world")
	# Both journeys use the same normal movement/actions as players. No teleports.
	await walk_to(Vector3(-2.8, 0, 0.1))
	await walk_to(Vector3(-2.8, 0, -4.0), 150, false)
	check(game.player.position.z > -2.6, "rack physically blocks the doorway before repair")
	await walk_to(Vector3(-2.8, 0, 0.1))
	await walk_to(Vector3(0, 0, -0.5))
	await tap("interact")
	check(game.editing_support, "nearby interaction starts support adjustment")
	Input.action_press("left")
	await frames(85)
	Input.action_release("left")
	await tap("interact")
	check(game.lever.pivot < -1.4, "continuous support movement through normal controls")
	await walk_to(Vector3(3.05, 0, -0.95))
	Input.action_press("press")
	await frames(150)
	check(game.lever.height() >= 0.22, "normal approach and effort lift the rack")
	await tap("brace")
	Input.action_release("press")
	await frames(180)
	check(game.repaired, "first normal-input route repairs the workshop")
	await walk_to(Vector3(-2.8, 0, 0.1))
	await walk_to(Vector3(-2.8, 0, -4.8))
	check(game.player.position.z < -3.8, "repaired doorway is physically traversable")
	check(game.apprentice.position.z < -3, "apprentice enters reopened workshop")
	var save: Dictionary = game.snapshot()
	game._reset()
	await frames(5)
	check(game.restore(save), "valid save restores")
	check(game.repaired and game.lever.braced and game.player.position.z < -3.8, "repair and interior location persist")
	game._reset()
	await frames(10)
	for i in range(4):
		await walk_to(Vector3(-2.8, 0, 0.0))
		await walk_to(Vector3(-2.8, 0, -0.8))
		await tap("interact")
		check(game.held != null, "unloading route picks up crate %d" % (i + 1))
		await walk_to(Vector3(-2.8, 0, 0.4))
		await walk_to(Vector3(3.25, 0, 2.9))
		await tap("interact")
		check(game.held == null, "unloading route drops crate %d" % (i + 1))
		await frames(30)
	check(game.attached_count() == 2, "four real carried crates reduce rack load")
	await walk_to(Vector3(3.05, 0, -0.95))
	Input.action_press("press")
	await frames(150)
	await tap("brace")
	Input.action_release("press")
	await frames(180)
	check(game.repaired and absf(game.lever.pivot) < 0.01, "second normal-input route succeeds without moving support")
	for c in game.crates:
		check(c.position.y > -0.1, "dropped rigid body stays above floor")
	print("RESULT ", passed, " passed, ", failed, " failed")
	quit(0 if failed == 0 else 1)

func frames(n: int) -> void:
	for i in range(n):
		await physics_frame

func tap(action: String) -> void:
	Input.action_press(action)
	await frames(2)
	Input.action_release(action)
	await frames(2)

func walk_to(target: Vector3, limit: int = 650, must_arrive: bool = true) -> void:
	for i in range(limit):
		var diff = target - game.player.position
		diff.y = 0
		if diff.length() < 0.18:
			break
		var right: Vector3 = game.camera.global_basis.x
		right.y = 0
		var back: Vector3 = game.camera.global_basis.z
		back.y = 0
		var d = diff.normalized()
		var x = d.dot(right.normalized())
		var y = d.dot(back.normalized())
		for action in ["left", "right", "up", "down"]:
			Input.action_release(action)
		if x < -0.12:
			Input.action_press("left", absf(x))
		elif x > 0.12:
			Input.action_press("right", absf(x))
		if y < -0.12:
			Input.action_press("up", absf(y))
		elif y > 0.12:
			Input.action_press("down", absf(y))
		await physics_frame
	for action in ["left", "right", "up", "down"]:
		Input.action_release(action)
	await frames(2)
	if must_arrive:
		var delta = target - game.player.position
		delta.y = 0
		if delta.length() > 0.3:
			check(false, "walk blocked: %s -> %s" % [game.player.position, target])
