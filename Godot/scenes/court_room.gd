extends Node3D

@export var chat_state: CourtHud

@export var camera_control: Camera3D
@export var look_targets: Array[Node3D]

const ROUND_OVER = preload("uid://bpfevypna7tvb") # round_over scene

func _ready() -> void:
	#chat_state.message_send.connect()
	chat_state.lookTargets = look_targets
	chat_state.no_turns_left.connect(_end_game_check)
	MsgM.buffer_update.connect(show_new_AI_message)
	
	if ApiClientWs.is_ws_connected:
		start_game_session()
	else:
		ApiClientWs.ws_connected.connect(start_game_session)

func show_new_AI_message(buffer_name: String) -> void:
	if buffer_name == GS.current_chat_room:
		var msg: Message = MsgM.get_buffer(buffer_name)[-1]
		if msg.role == "assistant":
			chat_state.display_message(msg)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_text_newline"):
		_end_game_check()
		
var ran_endgame: bool = false
var end_game_gossip: Array[Gossip] = []

func _end_game_check() -> void:
	if ran_endgame:
		return
	ran_endgame = true
	
	# initialize loading screen and add game over scene
	SceneMaganger.switch_scene_with_loading("res://scenes/vote_scene.tscn", "lol unused param bc i'm silly", false) # loading screen
	var instance = ROUND_OVER.instantiate()
	add_child(instance)
	
	var gossip_chadwick = await MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'chadwick_gainsbury')
	var gossip_dr_bones = await MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'dr_bones')
	var gossip_baby_the_binkie = await MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'baby_the_binkie')
	SceneMaganger.switch_now()
	if gossip_chadwick and gossip_dr_bones:
		var propagated = await MsgM.propagate_gossip([gossip_chadwick.id, gossip_dr_bones.id])
		end_game_gossip = propagated
	
	
#	TODO: start gossip engine.

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
