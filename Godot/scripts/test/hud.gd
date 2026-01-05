extends Control

@export var camera_control: Camera3D

@export var lookTargets: Array[Node3D]

@onready var tab_container: TabContainer = $TabContainer
@onready var look_down: TextureButton = $TabContainer/MarginContainer/LookDown
@onready var info_menu: MarginContainer = %InfoMenu
@onready var animation_player: AnimationPlayer = $TabContainer/InfoMenu/AnimationPlayer

func _ready() -> void:
	tab_container.current_tab = 0

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_text_newline"):
		camera_control.look_at_target(lookTargets.pick_random().global_position)

### LOOK BUTTONS ###
func _on_look_down_pressed() -> void:
	camera_control.look_at_target(lookTargets[4].global_position)
	tab_container.current_tab = 1
	animation_player.play("Show")
	#look_up.visible = true

func _on_look_up_pressed() -> void:
	pass
	#camera_control.look_at_target(lookTargets[0].global_position)
	#look_down.visible = true
	#look_up.visible = false

func _on_info_menu_close_btn_pressed() -> void:
	camera_control.look_at_target(lookTargets[0].global_position)
	tab_container.current_tab = 0
	animation_player.play("Hide")
