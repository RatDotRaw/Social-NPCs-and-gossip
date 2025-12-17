extends Camera3D

signal lookAt

@export var look_target: Vector3
@export var lerp_speed: float = 5

var lerp_transform: Transform3D

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	if look_target:
		# get basis to the looking target
		var target_basis = global_transform.looking_at(look_target, Vector3.UP).basis
		basis = basis.slerp(target_basis, lerp_speed*delta)

func look_at_target(target: Vector3): 
	look_target = target
