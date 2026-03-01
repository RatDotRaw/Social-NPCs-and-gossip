extends Node

# Use the ID returned from your /create_lobby HTTP call
var websocket_url = "ws://localhost:8000/ws/"

var socket := WebSocketPeer.new()
var _next_request_id: int = 0
var is_ws_connected: bool = false

signal ws_ready
signal ws_connected

func start_ws():
	var full_url = websocket_url+GS.sessionID
	print("Connecting to: ", full_url)
	var err = socket.connect_to_url(full_url)
	if err != OK:
		print("Could not connect to server.")
	ws_ready.emit()

func _process(_delta):
	socket.poll()
	
	var state = socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		if not is_ws_connected:
			is_ws_connected = true
			ws_connected.emit()
		
		# Check for incoming messages
		while socket.get_available_packet_count() > 0:
			var data_string = socket.get_packet().get_string_from_utf8()
			var data = JSON.parse_string(data_string)
			var payload_data: Dictionary = data.get("body") as Dictionary
			
			#print("### Received data from server: ", data)
			
			# if has id field, its a response to a request
			if data.has("id"):
				_on_message_received(payload_data)
			# Otherwise, it's a server-initiated message
			elif data.has("type"):
				var msg_type = data.get("type")
				if handlers.has(msg_type):
					handlers[msg_type].call(payload_data)
				else:
					print("DEBUG: No handler found for type: ", msg_type)
					print("PAYLOAD: ", data)
					push_warning("No handler for message type: %s" % msg_type)
			else:
				push_warning("Unknown message format: %s" % data)
	elif state == WebSocketPeer.STATE_CONNECTING:
		print("Still connecting...")
	elif state == WebSocketPeer.STATE_CLOSED:
		var code = socket.get_close_code()
		var reason = socket.get_close_reason()
		("WebSocket closed with code: %d, reason: %s" % [code, reason])
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

## Send a request to teh server
func send_request(type: String, reqData: Dictionary = {}) -> void:
	assert(type, "Type was not set correctly")
	assert((type != ""), "Type was not set correctly")
	
	reqData['type'] = type
	_send_over_socket(reqData)

## Send a request returning the response
## Very wacky and can hang forever if server doesnt respond.
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

#region super specific calls
func create_lobby() -> String:
	print("requesting new lobby (session)")
	var http_request = HTTPRequest.new()
	add_child(http_request)
	
	var url = "http://localhost:8000/create_lobby"
	var headers = ["Content-Type: application/json"]
	var error = http_request.request(url, headers, HTTPClient.METHOD_POST)
	
	if error != OK:
		assert(false, "error happened in the HTTP request")

	var response = await http_request.request_completed
	http_request.queue_free()

	# Parse the response
	# response[0] = result, [1] = response_code, [2] = headers, [3] = body
	if response[1] == 200:
		var json = JSON.new()
		json.parse(response[3].get_string_from_utf8())
		var response_data = json.get_data()
		
		if response_data.has("id"):
			return response_data["id"]
	return ""

# add AI message to history
func add_ai_message(data: Dictionary) -> void:
	MsgM.add_message_dict(GS.current_chat_room, data)

#endregion

# --- handlers ---
#region handlers 
var handlers: Dictionary = {
	"error": _log_server_error,
	"status_update": GS.set_server_status,
	"generated_AI_response": add_ai_message,
}

func _log_server_error(data: Dictionary) -> void:
	printerr("SERVER ERROR: ", data["message"])
	printerr("PAYLOAD: ", data)
	assert(false, "SERVER ERROR: "+ data["message"])

#endregion
