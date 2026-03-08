extends Node3D

@export var chat_state: CourtHud

@export var camera_control: Camera3D
@export var look_targets: Array[Node3D]

func _ready() -> void:
	#chat_state.message_send.connect()
	chat_state.lookTargets = look_targets
	
	if ApiClientWs.is_ws_connected:
		start_game_session()
	else:
		ApiClientWs.ws_connected.connect(start_game_session)

## create chatBuffer and participants
func start_game_session() -> void:
	print("connected an creating channel...")
	
	GS.current_chat_room = "court"
	MsgM.create_buffer(GS.current_chat_room)
	ApiClientWs.send_request(
		"create_message_buffer",
		{ "bufferName": GS.current_chat_room }
	)
	
	# add court system prompt
	ApiClientWs.send_request(
		"add_message",
		{
			"bufferName": GS.current_chat_room,
			"content": Prompts.COURT_SYSTEM,
			"role": 'system',
			"participantName": 'system'
		}
	)
	
	# creating NPC's
	ApiClientWs.send_request("create_participant", { "name": "You" })
	ApiClientWs.send_request(
		"create_participant",
		{ 
			"name": "Malachi-Hope",
			"personaId": "malachi_hope"
		}
	)
	print('Courtroom Gamestate Ready!')
