extends Node
class_name GameState

var sessionID: String
var current_chat_room: String # current messagebuffer selected on server.
const max_chat_turns: int = 10
var chat_turns_left: int = max_chat_turns

var update_clock: Timer = Timer.new()

# --- server state ---
var allow_server_request = true
var allow_new_user_message = true
var is_ai_bussy = false
# --- client state ---
var game_state_name = "court_senario"

func _ready() -> void:
	# setup clock to get server status updates
	update_clock.wait_time = 2 # update every 2 secs
	update_clock.autostart = true
	add_child(update_clock)
	
	# start and connect to websocket
	start_session()

func start_session() -> void:
	sessionID = await ApiClientWs.create_lobby()
	print("id received from server:", sessionID)
	ApiClientWs.ws_connected.connect(start_game_session)
	ApiClientWs.start_ws()

func start_game_session() -> void:
	update_clock.connect("timeout", _request_server_status)
	print("connected an creating channel...")
	
	current_chat_room = "court"
	MsgM.create_buffer(current_chat_room)
	ApiClientWs.send_request(
		"create_message_buffer",
		{ "bufferName": current_chat_room }
	)
	
	ApiClientWs.send_request(
		"add_message",
		{
			"bufferName": current_chat_room,
			"content": Prompts.COURT_SYSTEM,
			"role": 'system',
			"participantName": 'assistant'
		}
	)
	
	# creating NPC's
	ApiClientWs.send_request(
		"create_participant",
		{ 
			"name": "Malachi-Hope",
			"personaId": "malachi_hope"
		}
	)
	ApiClientWs.send_request(
		"create_participant",
		{ 
			"name": "You",
			#"personaId": "malachi_hope"
		}
	)
	print('Gamestate Ready!')

#region general server status sync
func _request_server_status() -> void:
	if not allow_server_request:
		return
	#print("seding ping")
	ApiClientWs.send_request("get_status")

### sync settings related to the server's status & allowed requests.
func set_server_status(data: Dictionary) -> void:
	var settings: Dictionary = data.get("state")
	if settings:
		allow_server_request = settings["allow_request"]
		allow_new_user_message = settings["allow_new_user_message"]
		is_ai_bussy = settings["is_ai_bussy"]
	pass
#endregion

## Create new messagen, send to server and request AI response
func new_user_message(msg: Message, chat_buffer_name: String)-> bool:
	if not allow_server_request or not allow_new_user_message:
		return false
	
	msg.participantName = "You"
	MsgM.add_message(current_chat_room, msg)
	
	var msg_dict: Dictionary = msg.to_object()
	msg_dict.merge({
		"bufferName": current_chat_room,
	})
	
	#print("and here is where it all went wrong.", msg.to_object())
	ApiClientWs.send_request("add_message",  msg_dict)
	ApiClientWs.send_request("get_status")
	ApiClientWs.send_request(
		"generate_AI_response",
		{
			"bufferName": current_chat_room,
			"participantName": "Malachi-Hope",
			"addRespToBuffer": true
		}
	)
	
	var msgArray: Array[Message] = [msg] # For some reason it needs an exact type
	return true
