extends ChatState
class_name CourtHud

@onready var tab_container: TabContainer = $TabContainer

@onready var animation_player: AnimationPlayer = %AnimationPlayer
@onready var animation_player_text: AnimationPlayer = %AnimationPlayerText
@onready var gpu_particles_2d: GPUParticles2D = %GPUParticles2D

@onready var confirm_btn: TextureButton = %ConfirmBtn
@onready var text_edit: TextEdit = %TextEdit

@export var camera_control: Camera3D
@export var lookTargets: Array[Node3D]

@onready var label_turns: Label = %LabelTurns
@onready var turns_progress_bar: TextureProgressBar = %TurnsProgressBar

func _ready() -> void:
	tab_container.current_tab = 0
	confirm_btn.pressed.connect(_send_message_and_udpate)

	message_send.connect(_update_progress_bar)
	_update_progress_bar()

func _send_message_and_udpate() -> void:
	if send_message():
		_update_progress_bar()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_text_newline"):
		camera_control.look_at_target(lookTargets.pick_random().global_position)

func _update_progress_bar() -> void:
	
	var progress = (float(chat_turns_left)/float(max_chat_turns))*100
	turns_progress_bar.value = progress
	label_turns.text = str(chat_turns_left) +'/'+ str(max_chat_turns)
	
	gpu_particles_2d.restart()
	gpu_particles_2d.one_shot = true
	animation_player_text.play("BigShake")
	animation_player.play("Shakey")

func _on_look_down_pressed() -> void:
	camera_control.look_at_target(lookTargets[4].global_position)
	animation_player.play("Show")

func _on_info_menu_close_btn_pressed() -> void:
	camera_control.look_at_target(lookTargets[0].global_position)
	tab_container.current_tab = 0
	animation_player.play("Hide")
