extends ChatState
class_name CourtHud

@onready var tab_container: TabContainer = $TabContainer
@onready var text_box_scene: MarginContainer = %TextBoxScene

@onready var animation_player: AnimationPlayer = %AnimationPlayer
@onready var animation_player_text: AnimationPlayer = %AnimationPlayerText
@onready var gpu_particles_2d: GPUParticles2D = %GPUParticles2D

@onready var confirm_btn: TextureButton = %ConfirmBtn
@onready var text_edit: TextEdit = %TextEdit

@export var camera_control: Camera3D
@export var participants: Array[Participant]
@export var forward_target: Node3D
@export var book_target: Node3D

@onready var label_turns: Label = %LabelTurns
@onready var turns_progress_bar: TextureProgressBar = %TurnsProgressBar

# TODO: add audio sound bytes

func _ready() -> void:
	tab_container.current_tab = 0
	confirm_btn.pressed.connect(_send_message_and_udpate)
	GS.is_ai_busy_signal.connect(_udpate_chatbox_visuals)
	
	text_box_scene.next_btn_pressed.connect(hide_message)
	
	message_send.connect(_update_progress_bar)
	_update_progress_bar()

func _send_message_and_udpate() -> void:
	participant = participants.pick_random()
	if send_message():
		_update_progress_bar()

var previous_tab: int = 0
var previous_look_target: Vector3 = Vector3.ZERO
func display_message(msg: Message) -> void:
	previous_tab = tab_container.current_tab
	previous_look_target = camera_control.look_target
	tab_container.current_tab = 3
	text_box_scene.display_message(msg)
	camera_control.look_at_target(PM.get_participant(msg.participantName).look_target)

func hide_message() -> void:
	tab_container.current_tab = previous_tab
	camera_control.look_at_target(previous_look_target)

@onready var cross: TextureRect = %Cross
func _udpate_chatbox_visuals(allow: bool) -> void:
	cross.visible = allow

func _update_progress_bar() -> void:
	var progress = (float(chat_turns_left)/float(max_chat_turns))*100
	turns_progress_bar.value = progress
	label_turns.text = str(chat_turns_left) +'/'+ str(max_chat_turns)
	
	gpu_particles_2d.restart()
	gpu_particles_2d.one_shot = true
	animation_player_text.play("BigShake")
	animation_player.play("Shakey")

func _on_look_down_pressed() -> void:
	camera_control.look_at_target(book_target.global_position)
	animation_player.play("Show")

func _on_info_menu_close_btn_pressed() -> void:
	camera_control.look_at_target(forward_target.global_position)
	tab_container.current_tab = 0
	animation_player.play("Hide")
