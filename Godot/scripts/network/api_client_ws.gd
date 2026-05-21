extends Node

# Use the ID returned from your /create_lobby HTTP call
var websocket_url = "ws://localhost:8000/ws/"

var socket := WebSocketPeer.new()
var _next_request_id: int = 0
var ws_started: bool = false ## if ws process started
var is_ws_connected: bool = false ## if ws is connected

signal ws_connected
signal ws_closed
signal http_request_failed

func start_ws():
	ws_started = true
	process_mode = Node.PROCESS_MODE_INHERIT
	
	var full_url = websocket_url+GS.sessionID
	print("Connecting to: ", full_url)
	var err = socket.connect_to_url(full_url)
	if err != OK:
		print("Could not connect to server.")


func _process(_delta):
	if not ws_started: return
	
	socket.poll()
	
	var state = socket.get_ready_state()
	if state == WebSocketPeer.STATE_OPEN:
		if not is_ws_connected:
			is_ws_connected = true
			ws_connected.emit()
		
		# Check for incoming messages
		while socket.get_available_packet_count() > 0:
			var data_string = socket.get_packet().get_string_from_utf8()
			var data: Dictionary = JSON.parse_string(data_string)

			# Robust logging for debugging parse failures
			if data == null:
				push_error("ws JSON PARSE FAILED: raw string = '%s'" % data_string)
				continue
			if not data is Dictionary:
				push_error("WS parsed data not dict: type = %s, value = %s" % [typeof(data), data])
				continue

			var body_raw = data.get("body")
			if body_raw == null:
				push_warning("WS no 'body' field: data = %s" % data)
			elif not body_raw is Dictionary:
				push_warning("ws 'body' not dict: type = %s, value = %s" % [typeof(body_raw), body_raw])

			var payload_data = data.get("body") if data.get("body") is Dictionary else {}
			
			#print("### Received data from server: ", data)
			
			# if has id field, its a response to a request
			if data.has("id") && not data['id'].is_empty():
				_on_message_received(payload_data, data.get("id"), data)
			# Otherwise, it's a server-initiated message
			elif data.has("type"):
				var msg_type = data.get("type")
				if handlers.has(msg_type):
					if payload_data == null or not payload_data is Dictionary:
						push_error("ws handler skipped: handler='%s', payload_data=%s" % [msg_type, payload_data])
						continue
					handlers[msg_type].call(payload_data)
				else:
					print("ws DEBUG: No handler found for type: ", msg_type)
					print("PAYLOAD: ", data)
					push_warning("ws No handler for message type: %s" % msg_type)
			else:
				push_warning("Unknown message format: %s" % data)
	elif state == WebSocketPeer.STATE_CONNECTING:
		print("Still connecting...")
	elif state == WebSocketPeer.STATE_CLOSED:
		var code = socket.get_close_code()
		var reason = socket.get_close_reason()
		if is_ws_connected:
			is_ws_connected = false
			ws_closed.emit()
		ws_started = false
		process_mode = Node.PROCESS_MODE_DISABLED
		print("WebSocket closed. Code: %d, Reason: %s" % [code, reason])

func _send_over_socket(message: Dictionary) -> bool:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_string = JSON.stringify(message)
		socket.send_text(json_string)
		return true
	return false

## Send a request to teh server
func send_request(type: String, reqData: Dictionary = {}) -> void:
	assert(type or type != "", "Type was not set correctly")
	
	reqData['type'] = type
	_send_over_socket(reqData)

## Send a request returning the response
## Very wacky and can hang forever if server doesnt respond.
func send_request_async(type: String, data: Dictionary ={}) -> RequestResult:
	var request_id = _next_request_id
	_next_request_id += 1
	
	assert(type, "Type was not set correctly")
	assert((type != ""), "Type was not set correctly")
	
	data["id"] = str(request_id)
	data["type"] = type
	var request = data
	
	# create signal for when respond arrives
	var signal_name = "request_" + str(request_id)
	self.add_user_signal(signal_name, [{"name": "result", "type": RequestResult}])
	
	_send_over_socket(request)
	
	# Wait for the response
	var sig = Signal(self, signal_name)
	var result = await sig
	
	print("received async resp: ", result)
	self.remove_user_signal(signal_name)
	
	return result 

func _on_message_received(response: Dictionary, request_id: String, full_message: Dictionary):
	var signal_name = "request_" + request_id
	
	if self.has_user_signal(signal_name):
		var result = RequestResult.new()
		var response_type = full_message.get("type", "")
		
		if response_type == "error":
			result.ok = false
			result.error = full_message.get("body", "Unknown error")
			result.data = {}
		else:
			result.ok = true
			result.data = response
			result.error = ""
		
		self.emit_signal(signal_name, result)

#region super specific calls
func create_lobby() -> String:
	process_mode = Node.PROCESS_MODE_INHERIT
	print("requesting new lobby (session)")
	
	var max_retries = 6
	var retry_delay = 2.0
	
	for attempt in range(max_retries + 1):
		var http_request = HTTPRequest.new()
		add_child(http_request)
		
		var url = "http://localhost:8000/create_lobby"
		var headers = ["Content-Type: application/json"]
		
		var error = http_request.request(url, headers, HTTPClient.METHOD_POST)
		if error != OK:
			http_request.queue_free()
			if attempt < max_retries:
				printerr("HTTP request error, retrying (attempt ", str(attempt+1), "/", max_retries)
				await get_tree().create_timer(retry_delay).timeout # sloppy but simple
				continue
			else:
				printerr("HTTP request failed after many retries")
				http_request_failed.emit()
				return ""
		
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
		
		if attempt < max_retries:
			print("HTTP request failed (status %d), retrying in %d seconds... (attempt %d/%d)" % [response[1], retry_delay, attempt + 1, max_retries])
			await get_tree().create_timer(retry_delay).timeout
	
	print("HTTP request failed after %d retries" % max_retries)
	http_request_failed.emit()
	return ""

# add AI message to history
func add_ai_message(data: Dictionary) -> void:
	MsgM.add_message_dict(GS.current_chat_room, data)

func add_ai_gossip(data: Dictionary) -> void:
	print('fired fired fired')
	MsgM.add_gossip_dict(data)
#endregion

# --- handlers ---
#region handlers 
var handlers: Dictionary = {
	"error": _log_server_error,
	"status_update": GS.set_server_status,
	"generated_AI_response": add_ai_message,
	"propagate_gossip": add_ai_gossip,
	"gossipEngine_config": func(val: Dictionary) -> void: GS.gossipEngine_config = val;
}

func _log_server_error(data: Dictionary) -> void:
	printerr("SERVER ERROR: ", data["message"])
	printerr("PAYLOAD: ", data)
	assert(false, "SERVER ERROR: "+ data["message"])

#endregion
