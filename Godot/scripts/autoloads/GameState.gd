extends Node
class_name GameState

var sessionID: String
var current_chat_room: String # current messagebuffer selected on server.

var max_retries: int = 6

const FULLSCREEN_POPUP = preload("uid://dh6q4qi5ipl7")

#region game settings
#endregion

var update_clock: Timer = Timer.new()

# --- server state ---
var allow_server_request = true
signal is_ai_busy_signal
signal gossipEngine_config_update(gossipEninge_config: Dictionary)
var is_ai_busy: bool = false:
	set(val):
		is_ai_busy = val
		is_ai_busy_signal.emit(val)
var gossipEngine_config: Dictionary:
	set(val):
		gossipEngine_config = val
		gossipEngine_config_update.emit(val)
# --- client state ---
var game_state_name = "court_senario"

func _ready() -> void:
	ApiClientWs.ws_closed.connect(_attempt_reconnect)
	ApiClientWs.http_request_failed.connect(_on_http_request_failed)
	
	# setup clock to get server status updates
	update_clock.wait_time = 2 # update every 2 secs
	update_clock.autostart = true
	add_child(update_clock)
	
	# start and connect to websocket
	start_session()

func start_session() -> void:
	sessionID = await ApiClientWs.create_lobby()
	print("id received from server:", sessionID)
	ApiClientWs.ws_connected.connect(start_game_session, CONNECT_ONE_SHOT)
	print('Gamestate Ready and connected!')
	ApiClientWs.start_ws()

## runs when connected to server
func start_game_session() -> void:
	update_clock.connect("timeout", _request_server_status)
	print('Gamestate Ready and connected!')

func _attempt_reconnect() -> void:
	_create_disconnect_popup()
	
	for i in range(max_retries):
		if ApiClientWs.is_ws_connected:
			_clear_disconnect_popup()
			return
		await update_clock.timeout
		ApiClientWs.start_ws()
	
	_clear_disconnect_popup()
	_create_disconnect_popup("Connection could not be established :( \n\nRestart to try again")

func _on_http_request_failed() -> void:
	_create_disconnect_popup("Server connection failed. Please restart the application.")

#region connection popups
var disconnect_popup_node: Node
func _create_disconnect_popup(text: String = "") -> void:
	disconnect_popup_node = FULLSCREEN_POPUP.instantiate()
	get_tree().current_scene.add_child(disconnect_popup_node)
	if text != "":
		disconnect_popup_node.set_label(text)

func _clear_disconnect_popup() -> void:
	if disconnect_popup_node:
		disconnect_popup_node.close_popup()
#endregion

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
