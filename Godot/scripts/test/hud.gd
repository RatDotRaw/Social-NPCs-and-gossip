extends Control

@export var camera_control: Camera3D

@export var lookTargets: Array[Node3D]

@onready var tab_container: TabContainer = $TabContainer
@onready var look_down: TextureButton = $TabContainer/MarginContainer/LookDown
@onready var info_menu: MarginContainer = %InfoMenu
@onready var animation_player: AnimationPlayer = $TabContainer/InfoMenu/AnimationPlayer
@onready var text_edit: TextEdit = %TextEdit
@onready var confirm_btn: TextureButton = %ConfirmBtn

@onready var label_turns: Label = %LabelTurns
@onready var turns_progress_bar: TextureProgressBar = $TabContainer/MarginContainer/HBoxContainer/TurnsProgressBar

func _ready() -> void:
	tab_container.current_tab = 0
	confirm_btn.connect("pressed", send_message)
	_update_progress_bar()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_text_newline"):
		camera_control.look_at_target(lookTargets.pick_random().global_position)



#region message shenanigans
func send_message():
	if not GS.allow_new_user_message:
		return # TODO: notify player
	if not GS.current_chat_room:
		return
	
	var user_test: String = text_edit.text
	if not user_test or user_test == '':
		print('message canceled: "', user_test, '"')
		return
	print("player text input: '", text_edit.text, "'")
	
	var messge: Message = Message.new(user_test, "user", "You")
	if GS.new_user_message(messge, GS.current_chat_room):
		print("Creating new user messge:", messge.contents)
		GS.chat_turns_left -= 1
		_update_progress_bar()
	else:
		printerr("GS did not accept new user message")

func _update_progress_bar() -> void:
	turns_progress_bar.value = (float(GS.chat_turns_left)/float(GS.max_chat_turns))*100
	print((GS.chat_turns_left/GS.max_chat_turns)*100)
	label_turns.text = str(GS.chat_turns_left) +'/'+ str(GS.max_chat_turns)
#endregion

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
