extends Node
class_name GameState

var sessionID: String

signal update_messages(message: Array[Message])

var court_messages: Array[Message] = []

var update_clock: Timer = Timer.new()

func _ready() -> void:
	update_clock.wait_time = 2 # update every 2 secs
	update_clock.autostart = true
	update_clock.connect("timeout", _on_update)
	add_child(update_clock)

func _on_update() -> void:
	ApiClientWs.request_court_status()
	pass

func update_messages_list(new_entries: Array[Message]) -> void:
	var id_list: Array = court_messages.map(func(el: Message): return el.uuid);
	var new_messages: Array[Message] = []
	for item in new_entries:
		if not (item.uuid in id_list):
			court_messages.append(item)
			new_messages.append(item)
	if new_messages.size() > 0:
		update_messages.emit(new_messages)

## Create new message and notify the server
func new_user_message(msg: Message):
	msg.participantName = "You"
	court_messages.append(msg)
	ApiClientWs.send_user_message(msg)
	
	var msgArray: Array[Message] = [msg] # For some reason it needs to first define the type
	update_messages.emit(msgArray)

func add_message(msg: Message):
	assert(msg, "No message recieved")
	court_messages.append(msg)
	update_messages.emit(msg)
