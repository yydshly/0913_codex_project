extends RefCounted
## A constrained rigid lever: two attached point masses, massless beam,
## fixed frictional axle (viscous damping), and inelastic angular travel stops.
const G: float = 9.81
const LIMIT: float = 0.42
const STEP: float = 1.0 / 120.0
const DAMPING: float = 1.7
const DURATION: float = 12.0
var left_mass: float = 3.0
var right_mass: float = 2.0
var left_x: float = -2.0
var right_x: float = 2.0
var pivot: float = 0.0
var angle: float = 0.0
var velocity: float = 0.0
var time: float = 0.0
var samples: Array[Vector2] = [Vector2.ZERO]
var ticks: int = 0

func config() -> Dictionary:
	return {"left_mass":left_mass,"right_mass":right_mass,"left_x":left_x,"right_x":right_x,"pivot":pivot}

func configure(values: Dictionary) -> void:
	left_mass = clampf(float(values.get("left_mass", left_mass)), 0.5, 8.0)
	right_mass = clampf(float(values.get("right_mass", right_mass)), 0.5, 8.0)
	left_x = clampf(float(values.get("left_x", left_x)), -2.8, 1.8)
	right_x = clampf(float(values.get("right_x", right_x)), left_x + 0.6, 2.8)
	pivot = clampf(float(values.get("pivot", pivot)), left_x + 0.3, right_x - 0.3)
	reset_motion()

func reset_motion() -> void:
	angle = 0.0
	velocity = 0.0
	time = 0.0
	ticks = 0
	samples = [Vector2.ZERO]

func left_torque(a: float = angle) -> float:
	return left_mass * G * (pivot - left_x) * cos(a)

func right_torque(a: float = angle) -> float:
	return right_mass * G * (right_x - pivot) * cos(a)

func tick() -> bool:
	if ticks >= int(DURATION / STEP):
		return false
	var inertia = left_mass * pow(pivot - left_x, 2) + right_mass * pow(right_x - pivot, 2)
	var torque = right_torque() - left_torque()
	velocity += (torque / inertia - DAMPING * velocity) * STEP
	angle += velocity * STEP
	if angle <= -LIMIT:
		angle = -LIMIT
		velocity = maxf(0.0, velocity)
	elif angle >= LIMIT:
		angle = LIMIT
		velocity = minf(0.0, velocity)
	ticks += 1
	time = ticks * STEP
	if ticks % 4 == 0:
		samples.append(Vector2(time, angle))
	return true

func recording() -> Dictionary:
	return {"config": config().duplicate(true), "samples": samples.duplicate(), "duration":time}

static func angle_at(record: Dictionary, moment: float) -> float:
	var points: Array = record.get("samples", [])
	if points.is_empty():
		return 0.0
	if moment <= points[0].x:
		return points[0].y
	for i in range(1, points.size()):
		if points[i].x >= moment:
			return lerpf(points[i-1].y, points[i].y, inverse_lerp(points[i-1].x, points[i].x, moment))
	return points[-1].y
