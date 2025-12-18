extends Control

@export var camera_control: Camera3D

@export var lookTargets: Array[Node3D]

@onready var look_up: TextureButton = $LookUp
@onready var look_down: TextureButton = $LookDown

func _ready() -> void:
	look_up.visible = false

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_text_newline"):
		camera_control.look_at_target(lookTargets.pick_random().global_position)



### LOOK BUTTONS ###
func _on_look_down_pressed() -> void:
	camera_control.look_at_target(lookTargets[4].global_position)
	look_down.visible = false
	look_up.visible = true

func _on_look_up_pressed() -> void:
	camera_control.look_at_target(lookTargets[0].global_position)
	look_down.visible = true
	look_up.visible = false
