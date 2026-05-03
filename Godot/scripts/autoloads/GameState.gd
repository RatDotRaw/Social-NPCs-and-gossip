extends Node
class_name GameState

var sessionID: String
var current_chat_room: String # current messagebuffer selected on server.

#region game settings
#endregion

var update_clock: Timer = Timer.new()

# --- server state ---
var allow_server_request = true
signal is_ai_busy_signal
var is_ai_busy: bool = false:
	get:
		return is_ai_busy
	set(val):
		is_ai_busy = val
		is_ai_busy_signal.emit(val)
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

## runs when connected to server
func start_game_session() -> void:
	update_clock.connect("timeout", _request_server_status)
	print('Gamestate Ready and connected!')

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
		is_ai_busy = settings["is_ai_busy"]
	pass
#endregion
