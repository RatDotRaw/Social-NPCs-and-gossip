extends Node
class_name GameState

var sessionID: String

signal update_messages(message: Array[Message])

var court_messages: Array[Message] = []

var update_clock: Timer = Timer.new()

# --- server state ---
var allow_server_request = true
var allow_new_user_message = true
var is_ai_bussy = false
# --- client state ---
var court_senario = true

func _ready() -> void:
	update_clock.wait_time = 2 # update every 2 secs
	update_clock.autostart = true
	update_clock.connect("timeout", _on_update)
	add_child(update_clock)

func _on_update() -> void:
	if not allow_server_request:
		return
	print("seding ping")
	ApiClientWs.send_request_async("get_status")
	if court_senario:
		ApiClientWs.send_request_async("get_court_status")

### sync settings related to the server's status & allowed requests.
func set_server_status(data: Dictionary) -> void:
	var settings: Dictionary = data.get("state")
	if settings:
		allow_server_request = settings["allow_request"]
		allow_new_user_message = settings["allow_new_user_message"]
		is_ai_bussy = settings["is_ai_bussy"]
	pass

func update_messages_list(new_entries: Array[Message]) -> void:
	var id_list: Array = court_messages.map(func(el: Message): return el.uuid);
	var new_messages: Array[Message] = []
	for item: Message in new_entries:
		if not (item.uuid in id_list):
			court_messages.append(item)
			new_messages.append(item)
	if new_messages.size() > 0:
		update_messages.emit(new_messages)

## Create new messagen, notify the server and request AI response
func new_user_message(msg: Message)-> bool:
	if not allow_server_request:
		return false
	
	msg.participantName = "You"
	court_messages.append(msg) 
	
	if court_senario:
		ApiClientWs.send_request_async("new_user_message", msg.to_object())
		ApiClientWs.send_request_async("get_status")
		await ApiClientWs.send_request_async("request_AI_response")
	
	var msgArray: Array[Message] = [msg] # For some reason it needs an exact type
	update_messages.emit(msgArray)
	return true

func add_message(msg: Message):
	assert(msg, "No message recieved")
	court_messages.append(msg)
	update_messages.emit(msg)
