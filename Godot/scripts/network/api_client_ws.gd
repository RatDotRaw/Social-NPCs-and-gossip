extends Node

# Use the ID returned from your /create_lobby HTTP call
var session_id = "0" 
var websocket_url = "ws://localhost:8000/ws/" + session_id

var socket := WebSocketPeer.new()
var _next_request_id: int = 0

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
			var data_string = socket.get_packet().get_string_from_utf8()
			var data = JSON.parse_string(data_string)
			var payload_data = data.get("data")
			
			print("Received data from server:", data)
			
			# if has id field, its a response to a request
			if data.has("id"):
				_on_message_received(payload_data)
			# Otherwise, it's a server-initiated message
			elif data.has("type"):
				var msg_type = data.get("type")
				if handlers.has(msg_type):
					handlers[msg_type].call(payload_data)
				else:
					push_warning("No handler for message type: %s" % msg_type)
			else:
				push_warning("Unknown message format: %s" % data)
	
	elif state == WebSocketPeer.STATE_CLOSED:
		var code = socket.get_close_code()
		var reason = socket.get_close_reason()
		print("WebSocket closed. Code: %d, Reason: %s" % [code, reason])
		set_process(false) # Stop polling
	

func _send_over_socket(message: Dictionary) -> bool:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_string = JSON.stringify(message)
		socket.send_text(json_string)
		return true
	return false

func send_request_async(type: String, data: Dictionary ={}) -> RequestResult:
	var request_id = _next_request_id
	_next_request_id += 1
	
	assert(type, "Type was not set correctly")
	assert((type != ""), "Type was not set correctly")
	
	var request = {
		"id": str(request_id),
		"type": type,
		"data":data
	}
	
	# create signal for when respond arrives
	var signal_name = "request_" + str(request_id)
	self.add_user_signal(signal_name, [{"name": "result", "type": RequestResult}])
	
	_send_over_socket(request)
	
	# Wait for the response
	var sig = Signal(self, signal_name)
	var result = await sig
	self.remove_user_signal(signal_name)
	
	return result 

func _on_message_received(response: Dictionary):
	var signal_name = "request_" + str(response.id)
	
	if self.has_user_signal(signal_name):
		var result = RequestResult.new()
		result.success = not response.get("denied", false)
		result.denied = response.get("denied", false)
		result.reason = response.get("reason", "")
		result.data = response.get("data", {})
		
		self.emit_signal(signal_name, result)

# --- handlers ---
#region
var handlers: Dictionary = {
	"error": _log_server_error,
	"status_update": GS.set_server_status,
	"status_court": _handle_court_status
}

func _log_server_error(data: Dictionary) -> void:
	printerr("SERVER ERROR: ", data["message"])

func _handle_court_status(data: Dictionary):
	print("received data:", data)
	var msg_list: Array = data.get("court_messages")
	var new_messages: Array[Message] = []
	for msg: Dictionary in msg_list:
		new_messages.append(
			Message.new(
				msg["content"], 
				msg["role"], 
				msg["participantName"],
				msg["uuid"]
		))
	GS.update_messages_list(new_messages)
#endregion
