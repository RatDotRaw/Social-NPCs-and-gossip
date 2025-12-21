extends Node

# Use the ID returned from your /create_lobby HTTP call
var session_id = "0" 
var websocket_url = "ws://localhost:8000/ws/" + session_id

var socket := WebSocketPeer.new()

func _ready():
	print("Connecting to: ", websocket_url)
	var err = socket.connect_to_url(websocket_url)
	if err != OK:
		print("Could not connect to server.")

func _process(_delta):
	socket.poll()
	
	var state = socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		# Check for incoming messages
		while socket.get_available_packet_count() > 0:
			var packet = socket.get_packet()
			var data_string = packet.get_string_from_utf8()
			var data = JSON.parse_string(data_string)
			var msg_type = data.get("type")
			if handlers.has(msg_type):
				# Call the mapped function and pass the data
				handlers[msg_type].call(data)
			else:
				push_warning("No handler for message type: %s" % msg_type)
	elif state == WebSocketPeer.STATE_CLOSED:
		var code = socket.get_close_code()
		var reason = socket.get_close_reason()
		print("WebSocket closed. Code: %d, Reason: %s" % [code, reason])
		set_process(false) # Stop polling

func send_log_message():
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var message = {
			"type": "ping",
			"content": "hello world!"
		}
		var json_string = JSON.stringify(message)
		socket.send_text(json_string)
		print("Ping message sent!")
	else:
		print("Socket not open. Current state: ", socket.get_ready_state())

func _input(event):
	if event.is_action_pressed("ui_accept"):
		send_log_message()

func send_over_socket(message: Dictionary) -> bool:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_string = JSON.stringify(message)
		socket.send_text(json_string)
		return true
	return false

# --- common calls ---
func request_court_status() -> void:
	var msg: Dictionary = {
		"type": "get_court_status"
	}
	send_over_socket(msg)

func send_user_message(message: Message) -> void:
	var req_body: Dictionary = {
		"type": "new_user_message",
		"content": message.to_object()
	}
	send_over_socket(req_body)

# --- handlers ---

var handlers: Dictionary = {
	"status_court": _handle_court_status
}

func _handle_court_status(data: Dictionary):
	var msg_list: Array = data.get("court_messages")
	var new_messages: Array[Message] = []
	print("guh:", msg_list.size(), msg_list)
	for msg: Dictionary in msg_list:
		new_messages.append(
			Message.new(
				msg["content"], 
				msg["role"], 
				msg["participantName"],
				msg["uuid"]
		))
	GS.update_messages_list(new_messages)
