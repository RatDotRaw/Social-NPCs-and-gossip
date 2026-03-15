extends Node3D

@export var chat_state: CourtHud

@export var camera_control: Camera3D
@export var look_targets: Array[Node3D]

const ROUND_OVER = preload("uid://bpfevypna7tvb") # round_over scene

func _ready() -> void:
	#chat_state.message_send.connect()
	chat_state.lookTargets = look_targets
	chat_state.no_turns_left.connect(_end_game_check)
	
	if ApiClientWs.is_ws_connected:
		start_game_session()
	else:
		ApiClientWs.ws_connected.connect(start_game_session)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_text_newline"):
		_end_game_check()
		

func _end_game_check() -> void:
	var instance = ROUND_OVER.instantiate()
	add_child(instance)
	MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'chadwick_gainsbury')
	

## create chatBuffer and participants
func start_game_session() -> void:
	print("connected an creating channel...")
	
	GS.current_chat_room = "court"
	MsgM.create_buffer(GS.current_chat_room)
	#ApiClientWs.send_request("create_message_buffer", { "bufferName": GS.current_chat_room })
	# add court system prompt
	ApiClientWs.send_request("add_message", {
			"bufferName": GS.current_chat_room,
			"content": Prompts.COURT_SYSTEM,
			"role": 'system',
			"participantName": 'system'
		})
	# creating NPC's
	ApiClientWs.send_request("create_participant", { "name": "You" })
	ApiClientWs.send_request("create_participant", { 
			"name": "Malachi-Hope",
			"personaId": "malachi_hope"
		})
	print('Courtroom Gamestate Ready!')
	
	# request summary of case by persona
	MsgM.new_user_message(Message.new(Prompts.court_start_prompt[0], 'tool', 'tool'))


#func _generate_intro() -> void:
	#var buffer_name: String = str(randi())
	#MsgM.create_buffer(buffer_name )
	#ApiClientWs.send_request("add_message", {
			#"bufferName": buffer_name,
			#"content": Prompts.court_start_prompt,
			#"role": 'system',
			#"participantName": 'system'
		#})
	#
