extends RefCounted
## Constrained lever model: gravity torques, inertia, damping and travel stops.
## Distances in metres, forces in newtons, angle in radians. Not a general solver.

const LOAD_X = -2.8
const END_X = 3.2
const BASE_WEIGHT = 40.0
const CRATE_WEIGHT = 40.0
const EFFORT = 120.0
const LATCH_HEIGHT = 0.22
var pivot: float = 0.0
var angle: float = 0.0
var speed: float = 0.0
var count: int = 6
var braced: bool = false
var input_torque: float = 0.0
var load_torque: float = 0.0

func weight() -> float:
	return BASE_WEIGHT + count * CRATE_WEIGHT

func height() -> float:
	return (pivot - LOAD_X) * sin(angle)

func set_pivot(value: float) -> bool:
	if angle > 0.005 or braced:
		return false
	pivot = clampf(value, -2.0, 1.8)
	angle = 0.0
	speed = 0.0
	return true

func tick(dt: float, pressing: bool, effort_x: float = END_X) -> void:
	var arm: float = maxf(0.0, effort_x - pivot)
	input_torque = EFFORT * arm * cos(angle) if pressing else 0.0
	load_torque = weight() * (pivot - LOAD_X) * cos(angle)
	if braced:
		speed = 0.0
		return
	# Include payload inertia and a small beam inertia. Beam weight is omitted.
	var inertia: float = weight() / 9.81 * pow(pivot - LOAD_X, 2) + 22.0
	var acceleration: float = (input_torque - load_torque) / inertia - speed * 7.0
	speed += acceleration * dt
	angle += speed * dt
	var limit: float = minf(0.32, asin(minf(0.45 / (pivot - LOAD_X), 0.95)))
	if angle <= 0.0:
		angle = 0.0
		speed = maxf(speed, 0.0)
	if angle >= limit:
		angle = limit
		speed = minf(speed, 0.0)

func brace() -> bool:
	if height() < LATCH_HEIGHT or braced:
		return false
	braced = true
	speed = 0.0
	return true

func reset() -> void:
	pivot = 0.0
	angle = 0.0
	speed = 0.0
	count = 6
	braced = false
