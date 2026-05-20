extends Node3D

@export var chat_state: CourtHud

@export var camera_control: Camera3D

@onready var _3d_character_sprite: Sprite3D = %"3DCharacterSprite"
@onready var _3d_character_sprite_2: Sprite3D = %"3DCharacterSprite2"
@onready var _3d_character_sprite_3: Sprite3D = %"3DCharacterSprite3"
@onready var jury_point_left: Node3D = %JuryPointLeft
@onready var jury_point_middle: Node3D = %JuryPointMiddle
@onready var jury_point_right: Node3D = %JuryPointRight

const ROUND_OVER = preload("uid://bpfevypna7tvb") # round_over scene

func _ready() -> void:
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
	if event.is_action_pressed("ui_page_up"):
		_end_game_check()
	elif event.is_action_pressed("ui_page_down"):
		_pick_random_personas()
var ran_endgame: bool = false

func _end_game_check() -> void:
	if ran_endgame:
		return
	ran_endgame = true
	
	# initialize loading screen and add game over scene
	SceneMaganger.switch_scene_with_loading("res://scenes/vote_scene.tscn", "lol unused param bc i'm silly", false) # loading screen
	var instance = ROUND_OVER.instantiate()
	add_child(instance)
	
	var gossip_1 = await MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'chadwick_gainsbury')
	var gossip_2 = await MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'dr_bones')
	var gossip_3 = await MsgM.generate_gossip_from_message_buffer(GS.current_chat_room, 'baby_the_binkie')
	SceneMaganger.switch_now()
	await MsgM.propagate_gossip([gossip_1.id, gossip_2.id, gossip_3.id])

## create chatBuffer and participants
func start_game_session() -> void:
	print("connected an creating channel...")
	GS.current_chat_room = "court"
	MsgM.create_buffer(GS.current_chat_room)
	# add court system prompt
	ApiClientWs.send_request("add_message", {
			"bufferName": GS.current_chat_room,
			"content": Prompts.COURT_SYSTEM,
			"role": 'system',
			"participantName": 'system'
		})
	
	print("picking and loading personas...")
	var p1: Participant = PM.get_random_participant()
	var p2: Participant = PM.get_random_participant()
	var p3: Participant = PM.get_random_participant()
	
	chat_state.participants = [p1, p2, p3]
	
	p1.look_target = jury_point_left.global_position
	p2.look_target = jury_point_middle.global_position
	p3.look_target = jury_point_right.global_position
	
	_3d_character_sprite.set_image(p1.icon)
	_3d_character_sprite_2.set_image(p2.icon)
	_3d_character_sprite_3.set_image(p3.icon)
	
	# creating server side NPC's
	print("creating persona's")
	ApiClientWs.send_request("create_participant", { "name": "You" })
	ApiClientWs.send_request("create_participant", { 
			"name": p1.character_name,
			"personaId": p1.persona_id
		})
	ApiClientWs.send_request("create_participant", { 
			"name": p2.character_name,
			"personaId": p2.persona_id
		})
	ApiClientWs.send_request("create_participant", { 
			"name": p3.character_name,
			"personaId": p3.persona_id
		})
	
	print('Courtroom Gamestate Ready!')
	ApiClientWs.send_request("add_message", {
			"bufferName": GS.current_chat_room,
			"content": Prompts.court_start_prompt[0],
			"role": 'system',
			"participantName": 'system'
		})
	# request summary of case by persona
	MsgM.message_and_ai(Message.new("The court is now in order. Start by going over the case, the evidence and an opening question.", 'system', 'system'), p2)

#region useless functions for showcasing.
func _pick_random_personas() -> void:
	var p1: Participant = PM.get_random_participant()
	var p2: Participant = PM.get_random_participant()
	var p3: Participant = PM.get_random_participant()
	
	_3d_character_sprite.set_image(p1.icon)
	_3d_character_sprite_2.set_image(p2.icon)
	_3d_character_sprite_3.set_image(p3.icon)
