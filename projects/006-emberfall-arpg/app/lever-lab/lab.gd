extends Control

const Model = preload("res://model.gd")
const INK = Color("e9eee9")
const MUTED = Color("94a7ad")
const MINT = Color("65d3ba")
const GOLD = Color("e0ba79")
const CORAL = Color("eda384")
const BLUE = Color("7fc7dc")
var model = Model.new()
var font: SystemFont
var paused = true
var slow = false
var replaying = false
var replay_paused = false
var replay_time = 0.0
var accumulator = 0.0
var saved_a: Dictionary = {}
var drag_kind = ""
var selected = "pivot"
var resume_after_drag = false
var suppress_controls = false
var run_button: Button
var slow_button: Button
var replay_button: Button
var save_button: Button
var clear_button: Button
var timeline: HSlider
var left_slider: HSlider
var right_slider: HSlider
var left_value: Label
var right_value: Label
var clock_label: Label
var state_label: Label
var message: Label
var result_label: Label
var detail_label: Label
var selection_label: Label
var facts_label: Label
var compare_label: Label
var compare_heading: Label
var trace_enabled = true
var arrows_enabled = true
var formula_enabled = false
var bounds = Rect2(28, 116, 925, 508)
var plot_bounds = Rect2(77, 727, 826, 91)
var ui_ready = false
var test_mode = false

func _ready() -> void:
	test_mode = "--test-mode" in OS.get_cmdline_user_args()
	font = SystemFont.new()
	font.font_names = PackedStringArray(["Microsoft YaHei", "Noto Sans CJK SC", "sans-serif"])
	_build_ui()
	ui_ready = true
	_refresh()
	message.text = "拖动两个重物或支点，看看同一根梁会如何变化。"

func _style(color: Color, border: Color = Color("2f4149"), radius: int = 10) -> StyleBoxFlat:
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.border_color = border
	s.set_border_width_all(1)
	s.set_corner_radius_all(radius)
	return s

func _panel(rect: Rect2, color: Color = Color("132027")) -> Panel:
	var p = Panel.new()
	p.position = rect.position
	p.size = rect.size
	p.add_theme_stylebox_override("panel", _style(color))
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(p)
	return p

func _label(text_value: String, pos: Vector2, width: float, font_size: int = 17, color: Color = INK) -> Label:
	var l = Label.new()
	l.position = pos
	l.size.x = width
	l.text = text_value
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", font_size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(l)
	return l

func _button(text_value: String, pos: Vector2, width: float, callback: Callable, primary: bool = false) -> Button:
	var b = Button.new()
	b.position = pos
	b.size = Vector2(width, 40)
	b.text = text_value
	b.add_theme_font_override("font", font)
	b.add_theme_font_size_override("font_size", 16)
	b.add_theme_color_override("font_color", Color("102b27") if primary else INK)
	b.add_theme_stylebox_override("normal", _style(MINT if primary else Color("203139")))
	b.add_theme_stylebox_override("hover", _style(Color("a5ebd7") if primary else Color("344b54"), MINT))
	b.add_theme_stylebox_override("pressed", _style(Color("53b8a3") if primary else Color("405862")))
	b.add_theme_stylebox_override("focus", _style(Color(0,0,0,0), GOLD))
	b.add_theme_stylebox_override("disabled", _style(Color("18262b")))
	b.pressed.connect(callback)
	add_child(b)
	return b

func _slider(pos: Vector2, width: float, callback: Callable) -> HSlider:
	var s = HSlider.new()
	s.position = pos
	s.size = Vector2(width, 30)
	s.min_value = 0.5
	s.max_value = 8.0
	s.step = 0.5
	s.value_changed.connect(callback)
	add_child(s)
	return s

func _build_ui() -> void:
	_label("看得见的物理", Vector2(32, 25), 450, 31)
	_label("01  /  杠杆实验室", Vector2(35, 70), 600, 16, MUTED)
	_label("直接操作 · 实时观察 · 留下证据", Vector2(1040, 44), 370, 17, MINT)
	# Drawing canvas is rendered by the parent; only interface cards use child panels.
	_panel(Rect2(979, 116, 431, 508))
	_label("改变条件", Vector2(1003, 135), 220, 22)
	_label("滑块改变重量，画布拖动位置", Vector2(1003, 171), 380, 15, MUTED)
	_label("左侧重物", Vector2(1003, 215), 200, 17, CORAL)
	left_value = _label("3.0 kg", Vector2(1310, 215), 90, 17, CORAL)
	left_slider = _slider(Vector2(1003, 251), 377, _left_changed)
	left_slider.value = 3
	_label("右侧重物", Vector2(1003, 296), 200, 17, BLUE)
	right_value = _label("2.0 kg", Vector2(1310, 296), 90, 17, BLUE)
	right_slider = _slider(Vector2(1003, 332), 377, _right_changed)
	right_slider.value = 2
	selection_label = _label("选中：支点", Vector2(1003, 385), 235, 16, GOLD)
	_button("← 0.1 m", Vector2(1003, 416), 118, func(): nudge(-0.1))
	_button("0.1 m →", Vector2(1134, 416), 118, func(): nudge(0.1))
	_label("也可选中后使用键盘 ← / →", Vector2(1003, 466), 360, 14, MUTED)
	_button("显示 / 隐藏力", Vector2(1003, 510), 180, func(): arrows_enabled = not arrows_enabled; queue_redraw())
	_button("显示 / 隐藏轨迹", Vector2(1198, 510), 180, func(): trace_enabled = not trace_enabled; queue_redraw())
	_button("试试等力矩", Vector2(1003, 566), 180, balanced_example)
	_button("恢复初始布局", Vector2(1198, 566), 180, initial_example)
	_panel(Rect2(979, 646, 431, 227))
	compare_heading = _label("为什么会这样？", Vector2(1003, 665), 335, 20, MINT)
	result_label = _label("", Vector2(1003, 704), 380, 17)
	detail_label = _label("", Vector2(1003, 738), 380, 15, MUTED)
	detail_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	detail_label.size.y = 60
	_button("展开 / 收起原理", Vector2(1003, 818), 183, func(): formula_enabled = not formula_enabled; _refresh())
	_label("理想模型 · 不是测量仪器", Vector2(1200, 829), 200, 12, MUTED)
	run_button = _button("▶ 运行", Vector2(54, 562), 127, toggle_run, true)
	_button("单步", Vector2(192, 562), 80, step_once)
	slow_button = _button("速度 1×", Vector2(283, 562), 111, toggle_slow)
	_button("回到起点", Vector2(405, 562), 120, reset_motion)
	save_button = _button("保存为 A", Vector2(536, 562), 126, save_a)
	clear_button = _button("清除 A", Vector2(673, 562), 99, clear_a)
	replay_button = _button("回放", Vector2(783, 562), 142, toggle_replay)
	message = _label("", Vector2(55, 523), 871, 14, MUTED)
	state_label = _label("", Vector2(725, 135), 200, 14, MINT)
	clock_label = _label("", Vector2(758, 660), 180, 16, MUTED)
	_label("运动记录", Vector2(55, 659), 240, 21)
	_label("角度 / °     左端下沉为负，右端下沉为正", Vector2(55, 697), 600, 13, MUTED)
	timeline = HSlider.new()
	timeline.position = Vector2(77, 839)
	timeline.size = Vector2(826, 22)
	timeline.min_value = 0
	timeline.max_value = 0.1
	timeline.step = Model.STEP
	timeline.value_changed.connect(scrub)
	add_child(timeline)
	compare_label = _label("", Vector2(350, 665), 395, 13, GOLD)
	_label("拖动开始探索    ·    空格 运行 / 暂停    ·    F12 保存当前画面", Vector2(35, 881), 920, 12, MUTED)

func scene_origin(is_a: bool = false) -> Vector2:
	if saved_a.is_empty():
		return Vector2(490, 350)
	return Vector2(263 if is_a else 720, 350)

func scene_scale() -> float:
	var max_arm: float = 3.0 + absf(model.pivot)
	if not saved_a.is_empty():
		max_arm = maxf(max_arm, 3.0 + absf(saved_a.config.pivot))
	# Keep the full allowed motion inside the canvas, with a common A/B scale.
	return minf(122.0 if saved_a.is_empty() else 62.0, 95.0 / (max_arm * sin(Model.LIMIT)))

func view_time() -> float:
	return replay_time if replaying else model.time

func view_angle() -> float:
	return Model.angle_at(model.recording(), replay_time) if replaying else model.angle

func body_point(x: float, config: Dictionary, angle_value: float, origin: Vector2, scale_value: float) -> Vector2:
	var p: float = config.pivot
	var axle = origin + Vector2(p * scale_value, 0)
	return axle + Vector2(cos(angle_value), sin(angle_value)) * (x - p) * scale_value

func _draw() -> void:
	if not ui_ready:
		return
	draw_style_box(_style(Color("14242c"), Color("34464e")), bounds)
	draw_style_box(_style(Color("111d24")), Rect2(28, 646, 925, 227))
	for y in range(190, 500, 26):
		for x in range(52, 934, 26):
			draw_circle(Vector2(x, y), 0.8, Color(0.5, 0.7, 0.72, 0.1))
	if not saved_a.is_empty():
		draw_line(Vector2(487, 175), Vector2(487, 490), Color("35444b"), 1)
		_text("A  /  已保存", Vector2(55, 153), 17, GOLD)
		_text("B  /  当前实验", Vector2(515, 153), 17, MINT)
		_draw_scene(saved_a.config, Model.angle_at(saved_a, view_time()), scene_origin(true), scene_scale(), true)
	else:
		_text("B  /  当前实验", Vector2(55, 153), 17, MINT)
	_draw_scene(model.config(), view_angle(), scene_origin(), scene_scale(), false)
	_draw_plot()

func _text(text_value: String, at: Vector2, size: int = 16, color: Color = INK) -> void:
	draw_string(font, at, text_value, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)

func _arrow(start: Vector2, finish: Vector2, color: Color, width: float = 3) -> void:
	draw_line(start, finish, color, width, true)
	var d = (finish - start).normalized()
	var ortho = Vector2(-d.y, d.x)
	draw_colored_polygon(PackedVector2Array([finish, finish - d * 10 + ortho * 5, finish - d * 10 - ortho * 5]), color)

func _draw_scene(cfg: Dictionary, a: float, origin: Vector2, s: float, is_a: bool) -> void:
	var axle = origin + Vector2(cfg.pivot * s, 0)
	var left = body_point(-3, cfg, a, origin, s)
	var right = body_point(3, cfg, a, origin, s)
	var normal = Vector2(-sin(a), cos(a))
	var pale = GOLD if is_a else MINT
	var half = 199 if not saved_a.is_empty() else 410
	draw_line(Vector2(origin.x - half, 476), Vector2(origin.x + half, 476), Color("52636a"), 2)
	# Position rail and ticks remain horizontal and show actual editable coordinates.
	for n in range(-6, 7):
		var x = origin.x + n * 0.5 * s
		draw_line(Vector2(x, 488), Vector2(x, 496 if n % 2 == 0 else 492), Color("75858b"), 1)
		if n % 2 == 0:
			_text("%d" % (n / 2), Vector2(x - 5, 512), 11, MUTED)
	_text("m", Vector2(origin.x + 3 * s + 10, 512), 11, MUTED)
	# Triangular support and axle are physical reference points, not next-step controls.
	draw_colored_polygon(PackedVector2Array([axle + Vector2(0, 7), axle + Vector2(-31, 102), axle + Vector2(31, 102)]), Color("485a64"))
	draw_polyline(PackedVector2Array([axle + Vector2(-31, 102), axle + Vector2(0, 7), axle + Vector2(31, 102)]), Color("87969b"), 2, true)
	draw_style_box(_style(Color("2f414a"), Color("57666b"), 4), Rect2(axle + Vector2(-39, 101), Vector2(78, 14)))
	draw_line(left + normal * 5, right + normal * 5, Color("24333d"), 16, true)
	draw_line(left, right, Color("c6cfca") if is_a else Color("dce5dc"), 12, true)
	draw_line(left - normal * 4, right - normal * 4, Color("f2eee0"), 2, true)
	for n in range(-12, 13):
		var mark = body_point(n * 0.25, cfg, a, origin, s)
		draw_line(mark - normal * 5, mark + normal * (3 if n % 4 == 0 else 0), Color("52666c"), 1)
	draw_circle(axle, 9, Color("0f2027"))
	draw_circle(axle, 5, pale)
	if not is_a and selected == "pivot":
		draw_arc(axle, 16, 0, TAU, 40, GOLD, 2, true)
	if not is_a:
		_text("支点", axle + Vector2(-17, 86), 13, GOLD)
	var records: Array = saved_a.samples if is_a else model.samples
	if trace_enabled and records.size() > 1:
		for key in ["left_x", "right_x"]:
			var path = PackedVector2Array()
			for sample in records:
				if sample.x <= view_time() + 0.001:
					path.append(body_point(cfg[key], cfg, sample.y, origin, s) + Vector2(0, -40))
			if path.size() > 1:
				draw_polyline(path, Color(pale, 0.42), 3, true)
	for which in ["left", "right"]:
		var point = body_point(cfg[which + "_x"], cfg, a, origin, s)
		var mass: float = cfg[which + "_mass"]
		var color = CORAL if which == "left" else BLUE
		var sz = 60.0 if saved_a.is_empty() else 48.0
		var mass_rect = Rect2(point + Vector2(-sz / 2, -sz - 8), Vector2(sz, sz))
		draw_style_box(_style(color.darkened(0.72), color, 8), mass_rect)
		draw_rect(Rect2(mass_rect.position + Vector2(4, 4), Vector2(sz - 8, 6)), Color(color, 0.4))
		_text("%.1f" % mass, mass_rect.position + Vector2(9, sz * 0.57), 19 if sz > 50 else 16, color)
		_text("kg", mass_rect.position + Vector2(21 if sz > 50 else 17, sz * 0.85), 11, color)
		draw_line(point - Vector2(0, 7), point, color, 3, true)
		if arrows_enabled:
			var start = point + Vector2(sz / 2 + 10, -sz / 2)
			_arrow(start, start + Vector2(0, mass * Model.G * 1.2), color, 2)
			_text("%.1f N" % (mass * Model.G), start + Vector2(-15, -11), 12, color)
		if not is_a and selected == which:
			draw_style_box(_style(Color(0,0,0,0), GOLD, 9), mass_rect.grow(4))
		var arm = absf(cfg[which + "_x"] - cfg.pivot) * cos(a)
		var dim_y = 459.0 if which == "left" else 467.0
		draw_line(Vector2(point.x, dim_y), Vector2(axle.x, dim_y), Color(color, 0.7), 1, true)
		draw_line(Vector2(point.x, dim_y - 4), Vector2(point.x, dim_y + 4), color, 1)
		_text("%.2f m" % arm, Vector2((point.x + axle.x) / 2 - 20, dim_y - 7), 11, color)
	var lm: float = cfg.left_mass * Model.G * (cfg.pivot - cfg.left_x) * cos(a)
	var rm: float = cfg.right_mass * Model.G * (cfg.right_x - cfg.pivot) * cos(a)
	_text("左 %.1f   ↔   右 %.1f N·m" % [lm, rm], Vector2(origin.x - (147 if s > 80 else 145), 202), 16, pale)
	var extra = "已记录 %.1f s" % saved_a.duration if is_a else "倾角 %+.1f°" % rad_to_deg(a)
	_text(extra, Vector2(origin.x - 55, 232), 13, MUTED)

func _draw_plot() -> void:
	for value in [-20, 0, 20]:
		var y = plot_bounds.get_center().y - value / 30.0 * plot_bounds.size.y / 2
		draw_line(Vector2(plot_bounds.position.x, y), Vector2(plot_bounds.end.x, y), Color("2b3e46"), 1)
		_text("%+d" % value if value != 0 else "0", Vector2(41, y + 4), 11, MUTED)
	var duration: float = maxf(3, maxf(model.time, saved_a.get("duration", 0)))
	for t in range(0, int(ceil(duration)) + 1):
		var x = plot_bounds.position.x + t / duration * plot_bounds.size.x
		if x > plot_bounds.end.x:
			continue
		draw_line(Vector2(x, plot_bounds.position.y), Vector2(x, plot_bounds.end.y), Color("24353d"), 1)
		_text("%ds" % t, Vector2(x - 7, 832), 11, MUTED)
	var runs: Array = [model.recording()]
	var colors: Array = [MINT]
	if not saved_a.is_empty():
		runs.push_front(saved_a)
		colors.push_front(GOLD)
	for i in range(runs.size()):
		var line = PackedVector2Array()
		for p in runs[i].samples:
			line.append(Vector2(plot_bounds.position.x + p.x / duration * plot_bounds.size.x, plot_bounds.get_center().y - rad_to_deg(p.y) / 30 * plot_bounds.size.y / 2))
		if line.size() > 1:
			draw_polyline(line, colors[i], 2.5, true)
	var cursor_x = plot_bounds.position.x + view_time() / duration * plot_bounds.size.x
	draw_line(Vector2(cursor_x, plot_bounds.position.y), Vector2(cursor_x, plot_bounds.end.y), Color(0.85,0.91,0.86,0.5), 1)

func _physics_process(dt: float) -> void:
	if not ui_ready:
		return
	var rate = 0.25 if slow else 1.0
	if replaying:
		if not replay_paused:
			replay_time = minf(model.time, replay_time + dt * rate)
			if replay_time >= model.time:
				replay_paused = true
	elif not paused and drag_kind == "":
		accumulator += dt * rate
		while accumulator >= Model.STEP:
			accumulator -= Model.STEP
			if not model.tick():
				paused = true
				message.text = "已记录 12 秒。可以回放、保存为 A，或改变条件再试一次。"
				break
	_refresh()

func _input(event: InputEvent) -> void:
	if not ui_ready:
		return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if not event.pressed and drag_kind != "":
			end_drag()
		elif event.pressed and bounds.has_point(event.position) and event.position.y < 510:
			begin_drag(event.position)
	elif event is InputEventMouseMotion and drag_kind != "":
		drag_to(event.position)
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_F12:
			_capture.call_deferred()
		elif event.keycode == KEY_SPACE:
			var focus = get_viewport().gui_get_focus_owner()
			if focus is Button:
				return
			toggle_run()
			get_viewport().set_input_as_handled()
		elif event.keycode == KEY_LEFT or event.keycode == KEY_RIGHT:
			if get_viewport().gui_get_focus_owner() is Range:
				return
			nudge(-0.1 if event.keycode == KEY_LEFT else 0.1)
			get_viewport().set_input_as_handled()

func begin_drag(point: Vector2) -> bool:
	if replaying:
		message.text = "正在回放。先停止回放，就能调整当前实验。"
		return false
	var cfg: Dictionary = model.config()
	var origin = scene_origin()
	var scale_value = scene_scale()
	var axle = origin + Vector2(model.pivot * scale_value, 0)
	var hit = ""
	for which in ["left", "right"]:
		var p = body_point(cfg[which + "_x"], cfg, model.angle, origin, scale_value)
		if Rect2(p + Vector2(-39, -79), Vector2(78, 83)).has_point(point):
			hit = which
	if hit == "" and Rect2(axle + Vector2(-45, -19), Vector2(90, 138)).has_point(point):
		hit = "pivot"
	if hit == "":
		return false
	selected = hit
	drag_kind = hit
	resume_after_drag = not paused
	paused = true
	model.reset_motion()
	accumulator = 0
	message.text = "拖动中：受力关系实时更新。松开后继续观察。"
	_refresh()
	return true

func drag_to(point: Vector2) -> void:
	if drag_kind == "":
		return
	var value = (point.x - scene_origin().x) / scene_scale()
	_change_position(drag_kind, value)

func end_drag() -> void:
	drag_kind = ""
	paused = not resume_after_drag
	message.text = "布局已改变，运动从水平起点重新记录。A 的记录保持不变。" if not saved_a.is_empty() else "布局已改变。点击运行，观察两边怎样运动。"
	_refresh()

func _change_position(which: String, value: float) -> void:
	var cfg: Dictionary = model.config()
	if which == "pivot":
		cfg.pivot = clampf(value, cfg.left_x + 0.3, cfg.right_x - 0.3)
	elif which == "left":
		cfg.left_x = clampf(value, -2.8, cfg.pivot - 0.3)
	else:
		cfg.right_x = clampf(value, cfg.pivot + 0.3, 2.8)
	model.configure(cfg)
	accumulator = 0
	_refresh()

func nudge(amount: float) -> void:
	if replaying:
		return
	var key = "pivot" if selected == "pivot" else selected + "_x"
	_change_position(selected, model.config()[key] + amount)
	message.text = "位置已调整 %.1f m，新一次运动从水平起点开始。" % amount

func _left_changed(value: float) -> void:
	if suppress_controls or not ui_ready or replaying:
		return
	model.configure({"left_mass": value})
	accumulator = 0
	message.text = "左侧重量已改变，新一次实验从水平起点开始。"
	_refresh()

func _right_changed(value: float) -> void:
	if suppress_controls or not ui_ready or replaying:
		return
	model.configure({"right_mass": value})
	accumulator = 0
	message.text = "右侧重量已改变，新一次实验从水平起点开始。"
	_refresh()

func toggle_run() -> void:
	if replaying:
		replay_paused = not replay_paused
		if replay_time >= model.time and not replay_paused:
			replay_time = 0
	else:
		if model.time >= Model.DURATION:
			model.reset_motion()
		paused = not paused
	_refresh()

func step_once() -> void:
	if replaying:
		replay_paused = true
		replay_time = minf(model.time, replay_time + 1.0 / 30)
	else:
		paused = true
		for i in range(4):
			model.tick()
	_refresh()

func toggle_slow() -> void:
	slow = not slow
	_refresh()

func reset_motion() -> void:
	replaying = false
	paused = true
	model.reset_motion()
	accumulator = 0
	message.text = "保留当前布局，回到水平起点。"
	_refresh()

func save_a() -> void:
	if model.time < 0.1:
		message.text = "先运行一小段，再保存这次实验。"
		return
	saved_a = model.recording().duplicate(true)
	paused = true
	replaying = false
	message.text = "A 已保存。现在改变 B 的重量或位置，再运行，观察差别。"
	_refresh()

func clear_a() -> void:
	saved_a = {}
	_refresh()

func toggle_replay() -> void:
	if replaying:
		replaying = false
		paused = true
	elif model.time >= 0.1:
		replaying = true
		replay_paused = false
		replay_time = 0
		paused = true
		message.text = "正在播放已记录的运动，时间轴可以拖动。回放不会重新计算或改变实验。"
	_refresh()

func scrub(value: float) -> void:
	if suppress_controls or model.time < 0.1:
		return
	replaying = true
	replay_paused = true
	paused = true
	replay_time = clampf(value, 0, model.time)
	_refresh()

func balanced_example() -> void:
	if replaying:
		return
	# Unequal masses, equal torques: 4 kg * 1 m = 2 kg * 2 m.
	model.configure({"left_mass":4,"right_mass":2,"left_x":-1,"right_x":2,"pivot":0})
	paused = true
	accumulator = 0
	message.text = "两边重量不同。这次先预测一下，梁会往哪边转？然后自由尝试。"
	_refresh()

func initial_example() -> void:
	replaying = false
	model.configure({"left_mass":3,"right_mass":2,"left_x":-2,"right_x":2,"pivot":0})
	paused = true
	selected = "pivot"
	accumulator = 0
	message.text = "当前 B 已恢复初始布局，已保存的 A 不受影响。"
	_refresh()

func _refresh() -> void:
	if not ui_ready:
		return
	suppress_controls = true
	left_slider.value = model.left_mass
	right_slider.value = model.right_mass
	left_slider.editable = not replaying
	right_slider.editable = not replaying
	left_value.text = "%.1f kg" % model.left_mass
	right_value.text = "%.1f kg" % model.right_mass
	timeline.max_value = maxf(0.1, model.time)
	timeline.value = view_time()
	timeline.editable = model.time >= 0.1
	suppress_controls = false
	run_button.text = "▶ 继续回放" if replaying and replay_paused else "Ⅱ 暂停回放" if replaying else "▶ 运行" if paused else "Ⅱ 暂停"
	slow_button.text = "速度 ¼×" if slow else "速度 1×"
	replay_button.text = "停止回放" if replaying else "回放"
	replay_button.disabled = model.time < 0.1
	save_button.text = "更新 A" if not saved_a.is_empty() else "保存为 A"
	save_button.disabled = model.time < 0.1 or replaying
	clear_button.disabled = saved_a.is_empty()
	clock_label.text = "%.2f / %.2f s" % [view_time(), model.time] if replaying else "%.2f s / 12 s" % model.time
	state_label.text = "回放 · 已暂停" if replaying and replay_paused else "回放中" if replaying else "拖动中" if drag_kind != "" else "已暂停" if paused else "慢放运行中" if slow else "运行中"
	selection_label.text = "选中：" + {"pivot":"支点", "left":"左侧重物", "right":"右侧重物"}[selected]
	var a = view_angle()
	var difference: float = model.right_torque(a) - model.left_torque(a)
	if absf(a) >= Model.LIMIT - 0.001:
		result_label.text = "到达限位，装置停止继续转动。"
	elif absf(difference) < 0.01:
		result_label.text = "两侧力矩相等，重力不再推动转动。"
	elif difference < 0:
		result_label.text = "左侧力矩更大，推动左端下沉。"
	else:
		result_label.text = "右侧力矩更大，推动右端下沉。"
	if formula_enabled:
		detail_label.text = "力矩 = 重力 × 水平力臂。两质量固定在梁上；忽略梁自重，含阻尼与 ±24.1° 限位。每次改布局重置初态。"
	else:
		detail_label.text = "重物越重、离支点越远，转动作用越大。试着只改变一个条件，再与 A 比较。"
	compare_label.text = "金色 A · 青色 B  |  同一时间对齐" if not saved_a.is_empty() else "青色 B · 当前实验"
	if not saved_a.is_empty() and view_time() > saved_a.duration:
		compare_label.text = "A 已结束，左图停在其末帧；曲线未外推"
	queue_redraw()

func _capture() -> void:
	await RenderingServer.frame_post_draw
	var folder = OS.get_user_data_dir().path_join("captures")
	var error = DirAccess.make_dir_recursive_absolute(folder)
	if error != OK:
		message.text = "无法创建截图目录，请检查本地写入权限。"
		return
	var path = folder.path_join("lever-lab-live.png")
	error = get_viewport().get_texture().get_image().save_png(path)
	message.text = "截图已保存到本地用户目录 / captures。" if error == OK else "截图保存失败，请检查本地写入权限。"
	print("Screenshot ", error, " ", path)
