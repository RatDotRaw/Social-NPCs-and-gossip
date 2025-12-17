extends Control

@export var camera_control: Camera3D

@export var lookTargets: Array[Node3D]

func _unhandled_input(event: InputEvent) -> void:
	print("action received")
	if event.is_action_pressed("ui_text_newline"):
		camera_control.look_at_target(lookTargets.pick_random().global_position)
