extends ChatState
class_name CourtHud

@onready var tab_container: TabContainer = $TabContainer
@onready var text_box_scene: MarginContainer = %TextBoxScene

@onready var animation_player: AnimationPlayer = %AnimationPlayer
@onready var animation_player_text: AnimationPlayer = %AnimationPlayerText
@onready var gpu_particles_2d: GPUParticles2D = %GPUParticles2D

@onready var confirm_btn: TextureButton = %ConfirmBtn
@onready var text_edit: TextEdit = %TextEdit
@onready var clear_text_btn: TextureButton = %ClearTextBtn

@export var camera_control: Camera3D
@export var court_participants: CourtParticipants
@export var forward_target: Node3D
@export var book_target: Node3D

@onready var label_turns: Label = %LabelTurns
@onready var turns_progress_bar: TextureProgressBar = %TurnsProgressBar

func _ready() -> void:
	assert(court_participants is CourtParticipants, "CourtParticipants resource not assigned")
	
	MsgM.buffer_update.connect(show_new_AI_message)
	
	_on_look_down_pressed()
	tab_container.current_tab = 1
	
	tab_container.tab_changed.connect(_on_tab_changed)
	confirm_btn.pressed.connect(_send_message_and_udpate)
	clear_text_btn.pressed.connect(func (): text_edit.clear())
	GS.is_ai_busy_signal.connect(_udpate_chatbox_visuals)
	
	text_box_scene.continue_btn_pressed.connect(hide_message)
	
	message_send.connect(_update_progress_bar)
	_update_progress_bar()

func _send_message_and_udpate() -> void:
	participant = [court_participants.participant_1, court_participants.participant_2, court_participants.participant_3].pick_random()
	if send_message():
		_update_progress_bar()


var _pending_msg: Message = null
func show_new_AI_message(buffer_name: String) -> void:
	if buffer_name == GS.current_chat_room:
		var msg: Message = MsgM.get_buffer(buffer_name)[-1]
		if msg.role == "assistant":
			if tab_container.current_tab == 0:
				display_message(msg)
			else:
				_pending_msg = msg

var previous_tab: int = 0
var previous_look_target: Vector3 = Vector3.ZERO
func display_message(msg: Message) -> void:
	previous_tab = tab_container.current_tab
	previous_look_target = camera_control.look_target
	
	tab_container.current_tab = 2
	text_box_scene.display_message(msg)
	camera_control.look_at_target(PM.get_participant(msg.participantName).look_target)

func _on_tab_changed(tab: int) -> void:
	if tab == 0 and _pending_msg != null:
		var msg = _pending_msg
		_pending_msg = null
		display_message(msg)
	elif tab == 0:
		# start shakey animation again, it doesnt auto continue
		animation_player.play("Shakey")

func hide_message() -> void:
	tab_container.current_tab = previous_tab
	camera_control.look_at_target(previous_look_target)

@onready var cross: TextureRect = %Cross
func _udpate_chatbox_visuals(allow: bool) -> void:
	cross.visible = allow

func _update_progress_bar() -> void:
	if chat_turns_left == -1:
		chat_turns_left = max_chat_turns
	
	var progress = (float(chat_turns_left)/float(max_chat_turns))*100
	turns_progress_bar.value = progress
	label_turns.text = str(chat_turns_left) +'/'+ str(max_chat_turns)
	
	gpu_particles_2d.restart()
	gpu_particles_2d.one_shot = true
	animation_player_text.play("BigShake")
	animation_player.play("Shakey")

# tabContainer is set trough animation
func _on_look_down_pressed() -> void:
	camera_control.look_at_target(book_target.global_position)
	animation_player.play("Show")

# tabContainer is set trough animation
func _on_info_menu_close_btn_pressed() -> void:
	camera_control.look_at_target(forward_target.global_position)
	animation_player.play("Hide")
