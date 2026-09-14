extends Node3D

const LeverModel = preload("res://lever.gd")
const SAVE_PATH = "user://workshop-v1.json"
var lever = LeverModel.new()
var palette: Dictionary = {}
var player: CharacterBody3D
var avatar: Node3D
var apprentice: Node3D
var visitors: Array[Node3D] = []
var crates: Array[RigidBody3D] = []
var held: RigidBody3D = null
var beam: Node3D
var support: Node3D
var rack: Node3D
var rack_collider: CollisionShape3D
var wedge: Node3D
var camera: Camera3D
var lamp: OmniLight3D
var work_light: OmniLight3D
var gate_label: Label3D
var objective: Label
var context: Label
var toast: Label
var status: Label
var physics_text: Label
var physics_panel: PanelContainer
var help_panel: PanelContainer
var reset_dialog: ConfirmationDialog
var font: SystemFont
var marker: MeshInstance3D
var editing_support = false
var repaired = false
var repair_blend = 0.0
var time = 0.0
var message_time = 0.0
var moving_to = false
var target_pos = Vector3.ZERO
var facing = Vector3(0, 0, -1)
var pushing = false
var effort_x = 3.2
var elapsed_push = 0.0
var hint_cooldown = 0.0
var auto_mode = false
var was_loaded = false
var step_time = 0.0
var sound_player: AudioStreamPlayer
var save_clock = 0.0
var current_context = ""

func _ready() -> void:
	auto_mode = "--test-mode" in OS.get_cmdline_user_args()
	_input_map()
	_materials()
	_environment()
	_world()
	_mechanism()
	_characters()
	_ui()
	sound_player = AudioStreamPlayer.new()
	add_child(sound_player)
	if not auto_mode:
		_load_progress()
	_say("小满：架子挡住了门。梁和支撑都在这里，我们一起想个办法吧。", 12.0)
	if was_loaded:
		_say("已回到河湾工坊。你之前搬动的货物与修复成果都还在。", 8.0)

func _input_map() -> void:
	var bindings = {"left": KEY_A, "right": KEY_D, "up": KEY_W, "down": KEY_S,
		"interact": KEY_E, "press": KEY_SPACE, "brace": KEY_F, "turn": KEY_Q,
		"inspect": KEY_TAB, "help": KEY_H, "restart": KEY_R, "sprint": KEY_SHIFT}
	for action in bindings:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		var event = InputEventKey.new()
		event.physical_keycode = bindings[action]
		InputMap.action_add_event(action, event)

func _mat(color: String, roughness: float = 0.85) -> StandardMaterial3D:
	var m = StandardMaterial3D.new()
	m.albedo_color = Color(color)
	m.roughness = roughness
	return m

func _materials() -> void:
	var colors = {"wood": "6d4934", "wood_light": "b28b60", "wood_dark": "382c26",
		"plaster": "c5bca2", "roof": "425965", "stone": "777e78", "iron": "354448",
		"gold": "d8af66", "blue": "527d8c", "cream": "e0c7a0", "skin": "cfa582",
		"leaf": "667a48", "leaf_light": "92a36d", "green": "598472", "red": "985c40",
		"water": "466f78", "paper": "ded4ad", "earth": "68654d"}
	for key in colors:
		palette[key] = _mat(colors[key])
	var glow = _mat("ffcd82")
	glow.emission_enabled = true
	glow.emission = Color("ffc16b")
	glow.emission_energy_multiplier = 1.4
	palette["glow"] = glow

func _box(parent: Node3D, pos: Vector3, size: Vector3, material: Material, collide: bool = false) -> MeshInstance3D:
	var mesh = MeshInstance3D.new()
	var shape = BoxMesh.new()
	shape.size = size
	mesh.mesh = shape
	mesh.material_override = material
	parent.add_child(mesh)
	mesh.position = pos
	if collide:
		var body = StaticBody3D.new()
		body.name = "Body"
		mesh.add_child(body)
		var c = CollisionShape3D.new()
		c.name = "Shape"
		var box = BoxShape3D.new()
		box.size = size
		c.shape = box
		body.add_child(c)
	return mesh

func _cylinder(parent: Node3D, pos: Vector3, radius: float, height: float, material: Material, top: float = -1.0) -> MeshInstance3D:
	var mesh = MeshInstance3D.new()
	var cylinder = CylinderMesh.new()
	cylinder.bottom_radius = radius
	cylinder.top_radius = radius if top < 0 else top
	cylinder.height = height
	cylinder.radial_segments = 12
	mesh.mesh = cylinder
	mesh.material_override = material
	parent.add_child(mesh)
	mesh.position = pos
	return mesh

func _ball(parent: Node3D, pos: Vector3, radius: float, scale_v: Vector3, material: Material) -> MeshInstance3D:
	var mesh = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radius = radius
	sphere.height = radius * 2
	sphere.radial_segments = 12
	sphere.rings = 6
	mesh.mesh = sphere
	mesh.material_override = material
	parent.add_child(mesh)
	mesh.position = pos
	mesh.scale = scale_v
	return mesh

func _label(parent: Node3D, text: String, pos: Vector3, color: Color = Color("f0dfb3"), size: int = 30) -> Label3D:
	var l = Label3D.new()
	l.text = text
	l.font = font
	l.font_size = size
	l.pixel_size = 0.009
	l.modulate = color
	l.outline_size = 6
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = false
	parent.add_child(l)
	l.position = pos
	return l

func _environment() -> void:
	font = SystemFont.new()
	font.font_names = PackedStringArray(["Microsoft YaHei", "Noto Sans CJK SC", "sans-serif"])
	var env = WorldEnvironment.new()
	var e = Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("94a5a1")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("c8dbdb")
	e.ambient_light_energy = 0.35
	e.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	e.fog_enabled = true
	e.fog_light_color = Color("aab5a8")
	e.fog_density = 0.007
	env.environment = e
	add_child(env)
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48, -32, 0)
	sun.light_color = Color("ffdfad")
	sun.light_energy = 0.85
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 65
	add_child(sun)
	camera = Camera3D.new()
	add_child(camera)
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 17.5
	camera.position = Vector3(13.5, 17, 21)
	camera.look_at(Vector3(-0.2, 0.2, -0.8))
	camera.current = true
	camera.far = 100

func _world() -> void:
	_box(self, Vector3(0, -0.3, -1), Vector3(22, 0.55, 22), palette.earth, true)
	var rng = RandomNumberGenerator.new()
	rng.seed = 61247
	var paver_materials: Array = []
	for i in range(7):
		paver_materials.append(_mat(Color("8d9184").lightened((i - 3) * 0.035).to_html()))
	for row in range(25):
		for col in range(25):
			var x = -10.2 + col * 0.81 + (row % 2) * 0.36
			var z = -10.5 + row * 0.8
			_box(self, Vector3(x, -0.004 + rng.randf_range(-0.012, 0.012), z), Vector3(0.76, 0.09, 0.73), paver_materials[rng.randi_range(0, 6)])
	# The northern half is a cutaway workshop; the doorway and interior are walkable.
	for i in range(14):
		_box(self, Vector3(-3.5, 0.055, -7.5 + i * 0.34), Vector3(6.8, 0.13, 0.31), palette.wood_light)
	_box(self, Vector3(-3.5, 1.8, -7.8), Vector3(7.2, 3.6, 0.25), palette.plaster, true)
	_box(self, Vector3(-7.05, 1.8, -5.2), Vector3(0.25, 3.6, 5.3), palette.plaster, true)
	_box(self, Vector3(-5.65, 1.55, -2.65), Vector3(2.85, 3.1, 0.25), palette.plaster, true)
	_box(self, Vector3(-0.6, 1.55, -2.65), Vector3(1.25, 3.1, 0.25), palette.plaster, true)
	for x in [-7.0, -4.15, -1.28, 0.05]:
		_box(self, Vector3(x, 1.8, -2.57), Vector3(0.22, 3.6, 0.3), palette.wood_dark, true)
	for x in [-7.0, -4.7, -2.35, 0.0]:
		_box(self, Vector3(x, 1.85, -7.6), Vector3(0.18, 3.7, 0.22), palette.wood_dark)
	for y in [0.32, 2.5, 3.35]:
		_box(self, Vector3(-3.5, y, -7.6), Vector3(7.1, 0.17, 0.2), palette.wood)
	_box(self, Vector3(-3.5, 3.4, -2.65), Vector3(7.4, 0.22, 0.45), palette.wood_dark)
	for r in range(4):
		for c in range(17):
			var roof_tile = _box(self, Vector3(-7.35 + c * 0.45, 3.5 + r * 0.12, -2.4 - r * 0.36), Vector3(0.43, 0.12, 0.45), palette.roof)
			roof_tile.rotation.x = -0.24
	# Windows, shelves, stools and tools establish a usable interior.
	for x in [-5.55, -0.6]:
		_box(self, Vector3(x, 1.9, -2.49), Vector3(0.94, 1.25, 0.08), palette.wood_dark)
		for k in range(5):
			_box(self, Vector3(x - 0.35 + k * 0.175, 1.9, -2.41), Vector3(0.055, 1.1, 0.08), palette.wood_light)
		_box(self, Vector3(x, 1.85, -2.39), Vector3(0.9, 0.06, 0.1), palette.wood_light)
	_table(Vector3(-4.9, 0, -6.65), Vector3(2.5, 0.95, 0.85))
	for i in range(5):
		_box(self, Vector3(-5.7 + i * 0.32, 1.01, -6.6), Vector3(0.2, 0.09, 0.34), palette.iron)
		_box(self, Vector3(-5.7 + i * 0.32, 1.01, -6.24), Vector3(0.055, 0.07, 0.45), palette.wood_light)
	for y in [0.5, 1.4, 2.3]:
		_box(self, Vector3(-6.62, y, -5.25), Vector3(0.58, 0.1, 2.5), palette.wood, true)
		for i in range(4):
			_pot(Vector3(-6.6, y + 0.1, -6.1 + i * 0.53), 0.17)
	_table(Vector3(-1.25, 0, -6.3), Vector3(1.0, 0.9, 1.1))
	_box(self, Vector3(-1.2, 1.0, -6.3), Vector3(0.7, 0.2, 0.65), palette.paper)
	_label(self, "河 湾 工 坊", Vector3(-2.7, 3.05, -2.38), Color("f5d9a0"), 35)
	# Courtyard storage area and free experimentation space.
	_box(self, Vector3(4.95, 0.1, 2.0), Vector3(2.8, 0.18, 3.0), palette.wood_dark)
	for i in range(8):
		_box(self, Vector3(3.64 + i * 0.37, 0.2, 2), Vector3(0.33, 0.08, 2.9), palette.wood_light)
	_label(self, "临时货位", Vector3(5.0, 0.8, 3.8), Color("f2d69b"), 27)
	_table(Vector3(4.4, 0, -5.7), Vector3(2.5, 0.85, 1.0))
	_pot(Vector3(4.8, 0.94, -5.7), 0.19)
	_box(self, Vector3(3.7, 1.0, -5.8), Vector3(0.6, 0.16, 0.4), palette.paper)
	# Canal and bridge at the eastern edge extend the visible world.
	_box(self, Vector3(9.05, 0.02, -1.3), Vector3(2.4, 0.07, 21), palette.water)
	for z in range(-10, 10):
		_box(self, Vector3(7.7, 0.16, z), Vector3(0.35, 0.4, 0.95), palette.stone, true)
		if z % 2 == 0:
			_cylinder(self, Vector3(7.6, 0.7, z), 0.07, 1.3, palette.wood_dark)
	_box(self, Vector3(7.6, 1.05, -1), Vector3(0.1, 0.12, 20), palette.wood)
	for i in range(8):
		_box(self, Vector3(8.9, 0.33, 4.6 + i * 0.23), Vector3(3, 0.14, 0.2), palette.wood)
	for z in [-8.5, 5.5]:
		_tree(Vector3(-8.8, 0, z), 1.0)
	_tree(Vector3(5.8, 0, -8.8), 0.9)
	for pos in [Vector3(-5.4, 0, 2.8), Vector3(0.5, 0, -3.7), Vector3(-7.7, 0, -1.8), Vector3(6.3, 0, -6.7)]:
		_pot(pos, 0.34)
		_ball(self, pos + Vector3(0, 0.75, 0), 0.46, Vector3(1, 0.8, 1), palette.leaf_light)
	for x in [-9.5, -6.5, -3.5, -0.5, 2.5, 5.5]:
		_cylinder(self, Vector3(x, 0.42, 7.8), 0.1, 0.85, palette.wood_dark)
	_box(self, Vector3(-2, 0.55, 7.8), Vector3(15, 0.12, 0.12), palette.wood)
	lamp = _lantern(Vector3(-4.08, 2.7, -2.3))
	work_light = _lantern(Vector3(-4, 2.7, -6.1))
	work_light.light_energy = 0.2
	# Bounds stay out of the player's view; no unseen walls inside the courtyard.
	for p in [Vector3(-10.4, 1, -1), Vector3(10.3, 1, -1)]:
		_invisible_wall(p, Vector3(0.2, 4, 22))
	for p in [Vector3(0, 1, -11), Vector3(0, 1, 8.8)]:
		_invisible_wall(p, Vector3(22, 4, 0.2))

func _invisible_wall(pos: Vector3, size: Vector3) -> void:
	var wall = _box(self, pos, size, palette.stone, true)
	wall.visible = false

func _table(pos: Vector3, size: Vector3) -> void:
	_box(self, pos + Vector3(0, size.y, 0), Vector3(size.x, 0.12, size.z), palette.wood_light, true)
	for x in [-1, 1]:
		for z in [-1, 1]:
			_box(self, pos + Vector3(x * (size.x / 2 - 0.12), size.y / 2, z * (size.z / 2 - 0.12)), Vector3(0.12, size.y, 0.12), palette.wood_dark)

func _pot(pos: Vector3, radius: float) -> void:
	_cylinder(self, pos + Vector3(0, radius * 0.75, 0), radius * 0.8, radius * 1.5, palette.red, radius)
	_cylinder(self, pos + Vector3(0, radius * 1.52, 0), radius * 1.04, radius * 0.15, palette.wood_dark)

func _tree(pos: Vector3, s: float) -> void:
	_cylinder(self, pos + Vector3(0, s * 1.5, 0), s * 0.16, s * 3, palette.wood, s * 0.1)
	for i in range(5):
		var a = i * TAU / 5
		_ball(self, pos + Vector3(cos(a) * 0.7 * s, (2.8 + i * 0.2) * s, sin(a) * 0.7 * s), s * 1.1, Vector3(1.1, 0.7, 1), palette.leaf if i % 2 == 0 else palette.leaf_light)

func _lantern(pos: Vector3) -> OmniLight3D:
	_cylinder(self, pos, 0.17, 0.46, palette.glow)
	for y in [-0.26, 0.26]:
		_cylinder(self, pos + Vector3(0, y, 0), 0.22, 0.06, palette.wood_dark)
	var l = OmniLight3D.new()
	l.position = pos
	l.light_color = Color("ffbf70")
	l.omni_range = 5.0
	l.light_energy = 1.5
	add_child(l)
	return l

func _mechanism() -> void:
	beam = Node3D.new()
	add_child(beam)
	_box(beam, Vector3.ZERO, Vector3(6.15, 0.18, 0.28), palette.wood_light, true)
	for x in range(7):
		_box(beam, Vector3(-3 + x, 0.103, 0), Vector3(0.04, 0.012, 0.29), palette.wood_dark)
	for x in [-2.9, 2.9]:
		_box(beam, Vector3(x, 0, 0), Vector3(0.12, 0.205, 0.305), palette.iron)
	support = Node3D.new()
	add_child(support)
	_cylinder(support, Vector3(0, 0.27, 0), 0.38, 0.54, palette.stone, 0.1)
	var axle = _cylinder(support, Vector3(0, 0.59, 0), 0.085, 0.56, palette.iron)
	axle.rotation.x = PI / 2
	_label(support, "支点", Vector3(0, 1.25, 0), Color("efcf85"), 24)
	# The rack carries boxes; its barrier actually blocks the workshop entrance.
	rack = Node3D.new()
	add_child(rack)
	var body = _box(rack, Vector3(0, 0.45, 0), Vector3(1.65, 0.8, 1.05), palette.wood_dark, true)
	rack_collider = body.get_node("Body/Shape")
	for z in [-0.5, 0.5]:
		for y in [0.08, 0.43, 0.82]:
			_box(rack, Vector3(0, y, z), Vector3(1.85, 0.1, 0.1), palette.wood_light)
	for x in [-0.88, 0.88]:
		_box(rack, Vector3(x, 0.44, 0), Vector3(0.12, 0.98, 1.1), palette.wood)
	gate_label = _label(rack, "待搬的货架", Vector3(0, 2.25, 0), Color("f1d7aa"), 25)
	wedge = Node3D.new()
	add_child(wedge)
	_box(wedge, Vector3.ZERO, Vector3(0.55, 0.3, 0.7), palette.gold)
	wedge.visible = false
	for i in range(6):
		var c = RigidBody3D.new()
		c.name = "Cargo%d" % i
		c.mass = 40.0 / 9.81
		c.freeze = true
		c.collision_layer = 2
		c.collision_mask = 3
		c.set_meta("on_rack", true)
		c.set_meta("slot", i)
		var physics_material = PhysicsMaterial.new()
		physics_material.friction = 0.8
		physics_material.bounce = 0.03
		c.physics_material_override = physics_material
		add_child(c)
		_box(c, Vector3.ZERO, Vector3(0.47, 0.45, 0.47), palette.wood_light)
		for x in [-0.18, 0.18]:
			_box(c, Vector3(x, 0, 0), Vector3(0.045, 0.49, 0.49), palette.wood_dark)
		for z in [-0.242, 0.242]:
			_box(c, Vector3(0, 0, z), Vector3(0.48, 0.045, 0.01), palette.wood)
		var collision = CollisionShape3D.new()
		var s = BoxShape3D.new()
		s.size = Vector3(0.48, 0.46, 0.48)
		collision.shape = s
		c.add_child(collision)
		crates.append(c)
	marker = _cylinder(self, Vector3.ZERO, 0.27, 0.025, palette.gold)
	marker.visible = false
	_update_mechanism()

func _person(parent: Node3D, coat: String, apron: bool = false) -> Node3D:
	var person = Node3D.new()
	parent.add_child(person)
	for x in [-0.13, 0.13]:
		var leg = _box(person, Vector3(x, 0.31, 0), Vector3(0.17, 0.49, 0.2), palette.wood_dark)
		leg.name = "LegL" if x < 0 else "LegR"
		_box(person, Vector3(x, 0.09, -0.05), Vector3(0.2, 0.15, 0.31), palette.iron)
	_cylinder(person, Vector3(0, 0.77, 0), 0.29, 0.55, palette[coat], 0.22)
	_cylinder(person, Vector3(0, 1.12, 0), 0.09, 0.12, palette.skin)
	_ball(person, Vector3(0, 1.36, 0), 0.23, Vector3(0.88, 1.08, 0.91), palette.skin)
	_ball(person, Vector3(0, 1.51, 0.02), 0.23, Vector3(0.99, 0.69, 1.02), palette.wood_dark)
	_ball(person, Vector3(0, 1.63, 0.11), 0.1, Vector3.ONE, palette.wood_dark)
	for x in [-0.09, 0.09]:
		_ball(person, Vector3(x, 1.38, -0.198), 0.022, Vector3.ONE, palette.iron)
	for x in [-0.32, 0.32]:
		var arm = _box(person, Vector3(x, 0.84, 0), Vector3(0.16, 0.47, 0.17), palette[coat])
		arm.name = "ArmL" if x < 0 else "ArmR"
		_ball(person, Vector3(x, 0.57, -0.02), 0.085, Vector3.ONE, palette.skin)
	if apron:
		_box(person, Vector3(0, 0.76, -0.25), Vector3(0.34, 0.46, 0.04), palette.cream)
	else:
		var strap = _box(person, Vector3(0, 0.87, -0.245), Vector3(0.07, 0.5, 0.04), palette.cream)
		strap.rotation.z = -0.45
		_box(person, Vector3(0.25, 0.61, 0.16), Vector3(0.25, 0.27, 0.15), palette.wood)
	return person

func _characters() -> void:
	player = CharacterBody3D.new()
	player.name = "Player"
	player.collision_layer = 4
	player.collision_mask = 3
	add_child(player)
	player.position = Vector3(2.8, 0.2, 3.8)
	var collision = CollisionShape3D.new()
	var capsule = CapsuleShape3D.new()
	capsule.radius = 0.27
	capsule.height = 1.6
	collision.shape = capsule
	collision.position.y = 0.81
	player.add_child(collision)
	avatar = _person(player, "blue")
	_cylinder(player, Vector3(0, 0.035, 0), 0.34, 0.02, palette.gold)
	apprentice = _person(self, "cream", true)
	apprentice.position = Vector3(-0.6, 0.08, 0.75)
	_label(apprentice, "小满", Vector3(0, 1.95, 0), Color("ead8ae"), 26)
	for i in range(3):
		var visitor = _person(self, ["green", "red", "wood_light"][i], i == 1)
		visitor.position = Vector3(6 - i * 1.2, 0.06, 5.8 + i * 0.35)
		visitors.append(visitor)

func _ui_label(text_value: String, size: int, color: Color = Color("eaddc6")) -> Label:
	var l = Label.new()
	l.text = text_value
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l

func _panel(pos: Vector2, size: Vector2, parent: Node) -> PanelContainer:
	var p = PanelContainer.new()
	p.position = pos
	p.custom_minimum_size = size
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.07, 0.115, 0.12, 0.91)
	style.border_color = Color(0.68, 0.57, 0.37, 0.6)
	style.set_border_width_all(1)
	style.set_corner_radius_all(7)
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 14
	style.content_margin_bottom = 14
	p.add_theme_stylebox_override("panel", style)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	parent.add_child(p)
	return p

func _ui() -> void:
	var layer = CanvasLayer.new()
	add_child(layer)
	var root = Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)
	var heading = _panel(Vector2(28, 24), Vector2(398, 94), root)
	var headings = VBoxContainer.new()
	heading.add_child(headings)
	headings.add_child(_ui_label("时空修复师   /   河湾工坊", 24, Color("f3d69b")))
	objective = _ui_label("帮小满把工坊重新开门", 17)
	headings.add_child(objective)
	var top_right = _panel(Vector2(1110, 24), Vector2(302, 80), root)
	var tv = VBoxContainer.new()
	top_right.add_child(tv)
	tv.add_child(_ui_label("自由工坊 · 实验样件", 17, Color("dec68f")))
	status = _ui_label("可搬货物 6 箱 · 工坊待修复", 14)
	tv.add_child(status)
	var bottom = _panel(Vector2(28, 802), Vector2(1384, 73), root)
	var b = VBoxContainer.new()
	bottom.add_child(b)
	context = _ui_label("走近木梁、支点或货物，看看能做什么", 19, Color("ffe1a2"))
	b.add_child(context)
	b.add_child(_ui_label("WASD / 点击地面 移动   ·   E 搬起 / 放下 / 调整   ·   空格 持续施力   ·   F 请小满固定   ·   Tab 观察   ·   H 帮助", 14))
	toast = _ui_label("", 19)
	toast.position = Vector2(245, 731)
	toast.size = Vector2(950, 60)
	toast.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	toast.add_theme_color_override("font_shadow_color", Color("182d32"))
	toast.add_theme_constant_override("shadow_offset_x", 2)
	toast.add_theme_constant_override("shadow_offset_y", 2)
	root.add_child(toast)
	physics_panel = _panel(Vector2(1080, 128), Vector2(332, 224), root)
	physics_text = _ui_label("", 16)
	physics_panel.add_child(physics_text)
	physics_panel.visible = false
	help_panel = _panel(Vector2(410, 230), Vector2(620, 360), root)
	var help = _ui_label("这里没有规定的解题顺序\n\n走近货箱，按 E 搬起；再按 E 放下。\n你可以把货物移到右侧木质货位，减轻架子负载。\n\n走近石支点按 E，按 A / D 连续调整，再按 E 离开。\n走到木梁右侧，按住空格施力；站得远近也会影响结果。\n架子抬高后，按住空格同时按 F，让小满放好支撑。\n\nTab 查看实时受力　 Q 转动视角　 滚轮缩放\nR 重新布置（会询问）　 Esc 暂停　 H 关闭说明", 18)
	help_panel.add_child(help)
	help_panel.visible = false
	reset_dialog = ConfirmationDialog.new()
	reset_dialog.title = "重新布置工坊"
	reset_dialog.dialog_text = "将货物与支点放回初始位置，重新尝试其他办法？"
	reset_dialog.ok_button_text = "重新布置"
	reset_dialog.cancel_button_text = "继续当前进度"
	reset_dialog.add_theme_font_override("font", font)
	reset_dialog.confirmed.connect(_reset)
	layer.add_child(reset_dialog)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_F12:
		_capture.call_deferred()
	if event.is_action_pressed("help"):
		help_panel.visible = not help_panel.visible
	if event.is_action_pressed("inspect"):
		physics_panel.visible = not physics_panel.visible
	if event.is_action_pressed("restart") and not auto_mode:
		reset_dialog.popup_centered(Vector2i(460, 180))
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if reset_dialog.visible:
			reset_dialog.hide()
		else:
			help_panel.visible = not help_panel.visible
	if event.is_action_pressed("turn"):
		var center = Vector3(-0.2, 0.2, -0.8)
		camera.position = center + (camera.position - center).rotated(Vector3.UP, PI / 4)
		camera.look_at(center)
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera.size = maxf(13, camera.size - 1)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera.size = minf(29, camera.size + 1)
		elif event.button_index == MOUSE_BUTTON_LEFT and not help_panel.visible and not reset_dialog.visible and not editing_support:
			var origin = camera.project_ray_origin(event.position)
			var direction = camera.project_ray_normal(event.position)
			var hit = Plane(Vector3.UP, 0.1).intersects_ray(origin, direction)
			if hit != null:
				target_pos = hit
				moving_to = true
				marker.visible = true
				marker.position = target_pos + Vector3(0, 0.04, 0)

func _physics_process(dt: float) -> void:
	if player == null:
		return
	time += dt
	hint_cooldown = maxf(0, hint_cooldown - dt)
	message_time = maxf(0, message_time - dt)
	toast.visible = message_time > 0
	if help_panel.visible or reset_dialog.visible:
		return
	if Input.is_action_just_pressed("interact"):
		_interact()
	var direction = Vector3.ZERO
	var input = Input.get_vector("left", "right", "up", "down")
	if editing_support:
		lever.set_pivot(lever.pivot + input.x * dt * 1.15)
		moving_to = false
		marker.visible = false
	else:
		var right = camera.global_basis.x
		right.y = 0
		var back = camera.global_basis.z
		back.y = 0
		direction = (right.normalized() * input.x + back.normalized() * input.y).normalized()
		if input.length() > 0:
			moving_to = false
			marker.visible = false
		elif moving_to:
			var diff = target_pos - player.position
			diff.y = 0
			if diff.length() < 0.18:
				moving_to = false
				marker.visible = false
			else:
				direction = diff.normalized()
	var speed: float = 3.5 if held == null else 2.35
	if Input.is_action_pressed("sprint") and held == null:
		speed = 5.0
	pushing = Input.is_action_pressed("press") and can_press()
	if pushing:
		direction = Vector3.ZERO
		moving_to = false
		marker.visible = false
		effort_x = clampf(player.position.x, lever.pivot + 0.25, 3.2)
		facing = Vector3(0, 0, -1 if player.position.z > -1.8 else 1)
	player.velocity.x = direction.x * speed
	player.velocity.z = direction.z * speed
	player.velocity.y -= 18 * dt
	player.move_and_slide()
	if direction.length() > 0.1:
		facing = direction
		step_time += dt
		if step_time > 0.32 and not auto_mode:
			step_time = 0
			_tone(140 + sin(time * 21) * 30, 0.035, 0.018)
	avatar.rotation.y = lerp_angle(avatar.rotation.y, atan2(-facing.x, -facing.z), minf(1, dt * 12))
	var walk: float = sin(time * 11) * minf(direction.length(), 1.0)
	avatar.get_node("LegL").rotation.x = walk * 0.45
	avatar.get_node("LegR").rotation.x = -walk * 0.45
	avatar.get_node("ArmL").rotation.x = -0.85 if pushing or held != null else -walk * 0.4
	avatar.get_node("ArmR").rotation.x = -0.85 if pushing or held != null else walk * 0.4
	avatar.position.y = -0.1 if pushing else 0.0
	if held != null:
		held.global_position = player.position + facing * 0.48 + Vector3(0, 0.88, 0)
		held.rotation = Vector3(0, avatar.rotation.y, 0)
	lever.count = attached_count()
	lever.tick(dt, pushing, effort_x)
	if pushing:
		elapsed_push += dt
		if elapsed_push > 1.4 and lever.height() < 0.015 and hint_cooldown <= 0:
			_say("还抬不起来。可以换个施力位置、调整支点，或先搬走一些货物。", 5)
			hint_cooldown = 9
	else:
		elapsed_push = 0
	if Input.is_action_just_pressed("brace"):
		_try_brace()
	if repaired:
		repair_blend = move_toward(repair_blend, 1.0, dt * 0.45)
	_update_mechanism()
	_update_people(dt)
	_update_hud()
	if not auto_mode:
		save_clock += dt
		if save_clock >= 3:
			save_clock = 0
			_save_progress()
	for c in crates:
		if c.position.y < -4:
			c.position = Vector3(4.6, 1.2, 2)
			c.linear_velocity = Vector3.ZERO

func can_press() -> bool:
	return not repaired and not editing_support and held == null and player.position.x > lever.pivot + 0.25 and player.position.x < 4.0 and absf(player.position.z + 1.8) < 1.1

func attached_count() -> int:
	var result = 0
	for c in crates:
		if c.get_meta("on_rack", false):
			result += 1
	return result

func _nearest_crate() -> RigidBody3D:
	var nearest: RigidBody3D = null
	var best = 1.7
	for c in crates:
		var diff = c.global_position - player.position
		diff.y = 0
		if diff.length() < best:
			best = diff.length()
			nearest = c
	return nearest

func _interact() -> void:
	if editing_support:
		editing_support = false
		_say("支点已放稳。走到梁的右侧试试，也可以继续搬货。", 4)
		return
	if held != null:
		_drop()
		return
	var support_distance = Vector2(player.position.x - lever.pivot, player.position.z + 1.8).length()
	if support_distance < 1.45 and not repaired:
		if lever.angle > 0.005:
			_say("先松开，让梁回到起点，再移动支点。", 4)
		else:
			editing_support = true
			_say("A / D 移动石支点，E 放稳。留意两边距离的变化。", 6)
		return
	var crate = _nearest_crate()
	if crate != null:
		held = crate
		held.set_meta("on_rack", false)
		held.freeze = true
		held.collision_layer = 0
		held.collision_mask = 0
		_say("搬起一箱货物。放到右侧木货位，或选择一块空地。", 4)
		_tone(330, 0.08, 0.08)
		return
	if player.position.distance_to(apprentice.position) < 2.0:
		_say("小满：谢谢你，进来看看吧。这里也有你的功劳。" if repaired else "小满：货箱可以分开搬，石支点也能移动。你想先试哪种办法？", 7)
	elif repaired and player.position.z < -3:
		_say("重新响起的工作声，和门边留下的修复记号。今天的工坊又热闹起来了。", 6)

func _drop() -> void:
	var point = player.position + facing * 0.85 + Vector3(0, 0.65, 0)
	# The marked storage platform has six physical places. Choose an empty place
	# when depositing nearby, while ordinary courtyard drops remain freeform.
	if player.position.x > 3.0 and player.position.x < 6.8 and player.position.z > 0.3 and player.position.z < 4.1:
		for slot in range(6):
			var candidate = Vector3(4.05 + (slot % 3) * 0.83, 0.65, 1.2 + floorf(slot / 3.0) * 1.05)
			var free = true
			for c in crates:
				if c != held and Vector2(c.position.x - candidate.x, c.position.z - candidate.z).length() < 0.6:
					free = false
			if free:
				point = candidate
				break
	# Returning a crate to the rack is explicit and preserves reversible experiments.
	var rack_distance = Vector2(player.position.x - rack.position.x, player.position.z - rack.position.z).length()
	if rack_distance < 1.7 and not repaired and player.position.z < -0.4:
		var used: Array = []
		for c in crates:
			if c.get_meta("on_rack", false):
				used.append(c.get_meta("slot"))
		for i in range(6):
			if not i in used:
				held.set_meta("slot", i)
				break
		held.set_meta("on_rack", true)
		held.collision_layer = 2
		held.collision_mask = 3
		held = null
		_say("货物放回架子，负载增加了。", 3)
		return
	var query = PhysicsShapeQueryParameters3D.new()
	var shape = BoxShape3D.new()
	shape.size = Vector3(0.49, 0.46, 0.49)
	query.shape = shape
	query.transform = Transform3D(Basis.IDENTITY, point)
	query.collision_mask = 3
	query.exclude = [held.get_rid(), player.get_rid()]
	if not get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty():
		_say("这里放不下，换一块空地。", 3)
		return
	held.global_position = point
	held.rotation = Vector3.ZERO
	held.collision_layer = 2
	held.collision_mask = 3
	held.freeze = false
	held.linear_velocity = Vector3.ZERO
	held.angular_velocity = Vector3.ZERO
	held = null
	_tone(190, 0.07, 0.08)

func _try_brace() -> void:
	if not pushing:
		_say("先在梁旁持续施力，把架子抬起来，再请小满固定。", 4)
		return
	if lever.brace():
		repaired = true
		_say("小满：撑稳了！我来把架子移开。门终于能打开了——进来吧！", 12)
		_tone(660, 0.5, 0.12)
		_save_progress()
	else:
		_say("还需要抬高一些，支撑才能放进去。", 4)

func _update_mechanism() -> void:
	var a: float = lever.angle
	beam.position = Vector3(lever.pivot + (0.2 - lever.pivot) * cos(a), 0.7 - (0.2 - lever.pivot) * sin(a), -1.8)
	beam.rotation.z = -a
	support.position = Vector3(lever.pivot, 0.03, -1.8)
	if repaired:
		beam.position = beam.position.lerp(Vector3(-7.8, 0.24, -4.2), repair_blend)
		beam.rotation = Vector3(0, repair_blend * PI / 2, -a * (1.0 - repair_blend))
		support.position = support.position.lerp(Vector3(-7.8, 0.03, -0.8), repair_blend)
	var lift: float = lever.height()
	rack.position = Vector3(lerpf(-2.8, -5.7, repair_blend), 0.05 + lift * (1.0 - repair_blend), -1.8)
	gate_label.text = "工坊已恢复" if repaired else "待搬的货架 · %d 箱" % attached_count()
	wedge.visible = repaired
	wedge.position = Vector3(-2.8, 0.14, -1.8)
	wedge.visible = repaired and repair_blend < 0.8
	for c in crates:
		if c.get_meta("on_rack", false):
			var slot: int = c.get_meta("slot", 0)
			c.position = rack.position + Vector3((slot % 3 - 1) * 0.52, 1.14 + floorf(slot / 3.0) * 0.48, 0)
			c.rotation = Vector3.ZERO
	work_light.light_energy = lerpf(0.2, 2.1, repair_blend)
	lamp.light_energy = 1.2 + sin(time * 2) * 0.08 + repair_blend * 0.5

func _update_people(dt: float) -> void:
	var goal = Vector3(-2.6, 0.08, -4.6) if repaired and repair_blend > 0.6 else Vector3(-0.6, 0.08, 0.75)
	var path_goal = goal
	if repaired and apprentice.position.z > -2.5:
		path_goal = Vector3(-2.6, 0.08, -1.0)
		if apprentice.position.distance_to(path_goal) < 0.15:
			apprentice.set_meta("at_door", true)
		if apprentice.get_meta("at_door", false):
			path_goal = goal
	var delta = path_goal - apprentice.position
	if delta.length() > 0.1 and repair_blend > 0.6:
		apprentice.position += delta.normalized() * minf(dt * 1.25, delta.length())
		apprentice.rotation.y = atan2(-delta.x, -delta.z)
		apprentice.get_node("LegL").rotation.x = sin(time * 8) * 0.35
		apprentice.get_node("LegR").rotation.x = -sin(time * 8) * 0.35
	else:
		var look = player.position - apprentice.position
		apprentice.rotation.y = lerp_angle(apprentice.rotation.y, atan2(-look.x, -look.z), dt * 2)
		apprentice.get_node("LegL").rotation.x = 0
		apprentice.get_node("LegR").rotation.x = 0
	for i in range(visitors.size()):
		var visitor = visitors[i]
		if repaired:
			var end = Vector3(-3.8 + i * 1.25, 0.06, 1.4 + (i % 2) * 0.8)
			var d = end - visitor.position
			if d.length() > 0.1:
				visitor.position += d.normalized() * dt * 0.65
				visitor.rotation.y = atan2(-d.x, -d.z)
				visitor.get_node("LegL").rotation.x = sin(time * 6 + i) * 0.3
				visitor.get_node("LegR").rotation.x = -sin(time * 6 + i) * 0.3
			else:
				visitor.rotation.y = 0
				visitor.get_node("LegL").rotation.x = 0
				visitor.get_node("LegR").rotation.x = 0

func _update_hud() -> void:
	objective.text = "工坊重新开门了 · 进去看看，也可以继续探索" if repaired else "帮小满把工坊重新开门 · 方法由你决定"
	status.text = "架上 %d 箱 · 已搬下 %d 箱" % [attached_count(), 6 - attached_count()]
	if editing_support:
		current_context = "A / D 连续移动支点   ·   E 放稳并离开"
	elif held != null:
		current_context = "正搬着货物   ·   E 放下   ·   右侧木货位可以暂存"
	elif pushing:
		current_context = "架子已抬高！保持空格，按 F 请小满放好支撑" if lever.height() >= 0.22 else "正在施力……观察木梁与架子，松开空格即可停止"
	elif repaired:
		current_context = "通路已经打开。走进工坊，看看你的修复带来了什么"
	elif Vector2(player.position.x - lever.pivot, player.position.z + 1.8).length() < 1.45:
		current_context = "E 调整石支点   ·   调整时 A / D 移动，E 放稳"
	elif _nearest_crate() != null:
		current_context = "E 搬起一箱货物   ·   架子轻一些，抬升会有什么变化？"
	elif can_press():
		current_context = "按住空格施力   ·   你站在梁的哪里，也会影响结果"
	elif player.position.distance_to(apprentice.position) < 2:
		current_context = "E 与小满聊聊   ·   可以自己先观察和尝试"
	else:
		current_context = "走近木梁、石支点或货物，开始你的尝试"
	context.text = current_context
	physics_text.text = "观察装置  /  Tab 收起\n\n架子与货物：%.0f N\n支点到载荷：%.2f m\n施力距离：%.2f m\n\n施力力矩：%.0f N·m\n载荷力矩：%.0f N·m\n抬升高度：%.0f cm\n\n省力时，施力端移动更远。\n理想杠杆 · 简化转动模型" % [lever.weight(), lever.pivot + 2.8, maxf(0, effort_x - lever.pivot), lever.input_torque, lever.load_torque, lever.height() * 100]

func _say(text: String, duration: float = 5.0) -> void:
	toast.text = text
	message_time = duration

func _tone(frequency: float, duration: float, volume: float) -> void:
	if auto_mode or sound_player == null:
		return
	var samples = PackedByteArray()
	var count = int(22050 * duration)
	samples.resize(count * 2)
	for i in range(count):
		var value = sin(TAU * frequency * i / 22050.0) * exp(-5.0 * i / count) * volume
		samples.encode_s16(i * 2, int(value * 32767))
	var wav = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = 22050
	wav.data = samples
	sound_player.stream = wav
	sound_player.play()

func snapshot() -> Dictionary:
	var objects: Array = []
	for c in crates:
		# An interrupted carry resumes as a crate on the ground near the player.
		var p = c.position
		if c == held:
			p = player.position + Vector3(0.8, 0.7, 0)
		objects.append({"on_rack": c.get_meta("on_rack"), "slot": c.get_meta("slot"), "p": [p.x, p.y, p.z]})
	return {"version": 1, "pivot": lever.pivot, "repaired": repaired, "angle": lever.angle if repaired else 0,
		"player": [player.position.x, maxf(0.2, player.position.y), player.position.z], "crates": objects}

func restore(data: Dictionary) -> bool:
	if data.get("version") != 1 or not data.get("crates") is Array or data.crates.size() != 6:
		return false
	if not data.get("player") is Array or data.player.size() != 3:
		return false
	for object in data.crates:
		if not object is Dictionary or not object.get("p") is Array or object.p.size() != 3:
			return false
		for v in object.p:
			if not (v is float or v is int) or not is_finite(float(v)):
				return false
	for v in data.player:
		if not (v is float or v is int) or not is_finite(float(v)):
			return false
	if not (data.get("pivot") is float or data.get("pivot") is int):
		return false
	lever.reset()
	lever.set_pivot(float(data.pivot))
	repaired = data.get("repaired", false) == true
	lever.braced = repaired
	lever.angle = clampf(float(data.get("angle", 0.15)), 0.0, 0.32) if repaired else 0.0
	repair_blend = 1.0 if repaired else 0.0
	player.position = Vector3(clampf(data.player[0], -9, 7), 0.3, clampf(data.player[2], -7, 7))
	for i in range(6):
		var object = data.crates[i]
		var c = crates[i]
		var attached: bool = object.get("on_rack", false) == true
		c.set_meta("on_rack", attached)
		c.set_meta("slot", clampi(int(object.get("slot", i)), 0, 5))
		c.freeze = attached
		c.collision_layer = 2
		c.collision_mask = 3
		c.position = Vector3(clampf(object.p[0], -9, 7), clampf(object.p[1], 0.35, 3), clampf(object.p[2], -7, 7))
		c.rotation = Vector3.ZERO
		c.linear_velocity = Vector3.ZERO
		c.angular_velocity = Vector3.ZERO
	held = null
	editing_support = false
	moving_to = false
	lever.count = attached_count()
	_update_mechanism()
	return true

func _save_progress() -> void:
	if auto_mode:
		return
	var f = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(snapshot()))

func _load_progress() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
	if parsed is Dictionary:
		was_loaded = restore(parsed)

func _reset() -> void:
	lever.reset()
	repaired = false
	repair_blend = 0
	held = null
	editing_support = false
	moving_to = false
	marker.visible = false
	player.position = Vector3(2.8, 0.2, 3.8)
	player.velocity = Vector3.ZERO
	apprentice.position = Vector3(-0.6, 0.08, 0.75)
	apprentice.set_meta("at_door", false)
	for i in range(crates.size()):
		var c = crates[i]
		c.set_meta("on_rack", true)
		c.set_meta("slot", i)
		c.freeze = true
		c.collision_layer = 2
		c.collision_mask = 3
	for i in range(visitors.size()):
		visitors[i].position = Vector3(6 - i * 1.2, 0.06, 5.8 + i * 0.35)
	_update_mechanism()
	_say("工坊已重新布置。试试换一种办法，看看会发生什么。", 6)
	_save_progress()

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST and player != null:
		_save_progress()

func _capture() -> void:
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute("res://test-output")
	get_viewport().get_texture().get_image().save_png("res://test-output/workshop-live.png")
	_say("已保存当前实机画面。", 3)
