extends SceneTree
const Model = preload("res://model.gd")
var passed = 0
var failed = 0
var lab: Control

func _initialize() -> void:
	_run.call_deferred()

func check(value: bool, label: String) -> void:
	if value:
		passed += 1
		print("PASS ", label)
	else:
		failed += 1
		push_error("FAIL " + label)

func steps(m, n: int) -> void:
	for i in range(n):
		m.tick()

func _run() -> void:
	var m = Model.new()
	check(is_equal_approx(m.left_torque(0), 58.86) and is_equal_approx(m.right_torque(0), 39.24), "initial torques use force times arm")
	steps(m, 30)
	check(m.angle < 0, "larger left torque lowers left side")
	m.configure({"left_mass":4,"right_mass":2,"left_x":-1,"right_x":2,"pivot":0})
	steps(m, 360)
	check(absf(m.angle) < 0.00001, "unequal masses with equal torques remain balanced")
	m.configure({"left_mass":3,"right_mass":2,"left_x":-2,"right_x":2,"pivot":-1})
	steps(m, 30)
	check(m.angle > 0, "moving support reverses motion without changing masses")
	m.configure({"pivot":99})
	check(m.pivot <= m.right_x - 0.3, "support stays between attached masses")
	m.configure({"left_mass":8,"right_mass":0.5,"pivot":0})
	steps(m, 1440)
	check(absf(m.angle) <= Model.LIMIT and is_zero_approx(m.velocity), "travel stop bounds rotation and stops velocity")
	check(is_equal_approx(m.time, 12) and m.samples.size() == 361, "recording has fixed simulated duration and sample count")
	var record = m.recording().duplicate(true)
	var saved_count = record.samples.size()
	m.configure({"left_mass":1})
	check(record.samples.size() == saved_count and record.config.left_mass == 8, "recordings preserve configuration independently")
	check(is_equal_approx(Model.angle_at(record, 12), record.samples[-1].y), "replay exactly reproduces final sample")
	check(is_equal_approx(Model.angle_at(record, 15), record.samples[-1].y), "end-of-record replay holds last frame without extrapolation")
	lab = load("res://lab.tscn").instantiate()
	root.add_child(lab)
	await process_frame
	await process_frame
	lab.set_physics_process(false)
	var initial_time: float = lab.model.time
	for i in range(120):
		lab._physics_process(Model.STEP)
	check(lab.model.time == initial_time, "paused laboratory does not advance physics")
	lab.toggle_run()
	for i in range(120):
		lab._physics_process(Model.STEP)
	check(is_equal_approx(lab.model.time, 1), "normal speed uses fixed physics steps")
	lab.toggle_run()
	lab.save_a()
	var a = lab.saved_a.duplicate(true)
	lab._left_changed(1)
	check(lab.model.time == 0 and lab.model.left_mass == 1 and lab.saved_a.config.left_mass == 3, "editing B restarts B and preserves A")
	lab.toggle_slow()
	lab.toggle_run()
	for i in range(120):
		lab._physics_process(Model.STEP)
	check(absf(lab.model.time - 0.25) < 0.01, "quarter speed advances one quarter simulated second")
	lab.toggle_run()
	lab.step_once()
	check(lab.paused and absf(lab.model.time - (0.25 + 1.0/30)) < 0.01, "single step advances one recorded interval then pauses")
	var end_time: float = lab.model.time
	var end_angle: float = lab.model.angle
	lab.toggle_replay()
	lab.scrub(end_time / 2)
	check(lab.replaying and lab.replay_paused and lab.model.time == end_time and lab.model.angle == end_angle, "scrubbing changes display without mutating live simulation")
	check(is_equal_approx(lab.view_angle(), Model.angle_at(lab.model.recording(), end_time/2)), "scrub renders recorded angle")
	lab.toggle_replay()
	lab.clear_a()
	lab.initial_example()
	var pivot_position = lab.scene_origin() + Vector2(lab.model.pivot * lab.scene_scale(), 20)
	check(lab.begin_drag(pivot_position), "pointer can pick the actual support")
	lab.drag_to(lab.scene_origin() + Vector2(-lab.scene_scale(), 20))
	lab.end_drag()
	check(absf(lab.model.pivot + 1) < 0.01, "support drag maps screen coordinates to physical distance")
	var mass_position = lab.body_point(lab.model.left_x, lab.model.config(), 0, lab.scene_origin(), lab.scene_scale()) - Vector2(0,40)
	check(lab.begin_drag(mass_position), "pointer can pick the actual mass")
	lab.drag_to(lab.scene_origin() + Vector2(-2.7 * lab.scene_scale(), -40))
	lab.end_drag()
	check(absf(lab.model.left_x + 2.7) < 0.01, "mass drag updates its attachment position")
	lab.nudge(-0.1)
	check(absf(lab.model.left_x + 2.8) < 0.01, "keyboard alternative nudges selected object")
	lab.initial_example()
	lab.balanced_example()
	lab.toggle_run()
	for i in range(360):
		lab._physics_process(Model.STEP)
	check(absf(lab.model.angle) < 0.00001, "UI balanced example actually balances")
	print("RESULT %d passed, %d failed" % [passed,failed])
	quit(0 if failed == 0 else 1)
