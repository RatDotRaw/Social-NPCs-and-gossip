extends Node

signal state_updated(state)
signal connection_failed(error: String)

@onready var http_request = HTTPRequest.new()
const baseUrl= "http://localhost:8000"
var headers = ["Content-Type: application/json", "User-Agent: GodotXDDD"]

func _ready():
	add_child(http_request)
	http_request.request_completed.connect(_on_request_completed)
	
	#create_session()

func create_session():
	if (!GS.sessionID):
		var error = http_request.request(baseUrl+"/create_lobby", headers, HTTPClient.METHOD_POST)
		if error != OK:
			printerr("Request failed with error code: ", error)

######################
### Court enpoints ###

func send_court_message(msg: Message) -> bool:
	var error = http_request.request(baseUrl+"/court_msgs", headers, HTTPClient.METHOD_POST, JSON.stringify(msg.contents))
	if error != OK:
		return false
	return true

func fetch_court_state():
	var error = http_request.request(baseUrl+"/court_msgs")
	if error != OK:
		connection_failed.emit("Failed to initiate request")

func get_court_reply():
	pass

func _on_request_completed(_result, response_code, _headers, body):
	if response_code != 200:
		connection_failed.emit("Server returned error: %d" % response_code)
		return
	var json: Dictionary = JSON.parse_string(body.get_string_from_utf8())
	if (json.has("id") && !GS.sessionID):
		GS.sessionID = json.id
		print("session id:", GS.sessionID)
	
	#var state = GameStateDTO.from_json(json)
	#state_updated.emit(state)
	
	print("===REQ BODY===")
	print(json)
