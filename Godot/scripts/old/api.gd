# res://Scripts/OllamaClient.gd
extends Node

# The global name of the client, useful for debugging
const CLIENT_NAME: String = "OllamaClient"

# The base URL for the Ollama API
const OLLAMA_BASE_URL: String = "http://localhost:11434"

# A variable to hold the HTTPRequest node
var _request_node: HTTPRequest

func _ready() -> void:
	# 1. Create a new HTTPRequest node instance
	_request_node = HTTPRequest.new()
	# 2. Add it as a child to the Singleton node
	add_child(_request_node)
	
	# 3. Connect the completion signal
	# We use a 'bind' to pass the request type, which is helpful if we add more APIs
	_request_node.request_completed.connect(_on_request_completed.bind("tags"))
	
	print("--- %s Initialized. Attempting to list models... ---" % CLIENT_NAME)
	
	# The initial call to list models
	list_models()

## Public function to send the request to get model tags
func list_models() -> void:
	var url = OLLAMA_BASE_URL + "/api/tags"
	var error = _request_node.request(url)
	
	if error != OK:
		# In a real game, you might want to emit a signal here instead of printing an error
		print("!!! %s: Error starting HTTP request for models: %d" % [CLIENT_NAME, error])

## Private function called automatically when *any* request finishes
func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray, request_type: String) -> void:
	# Process the result based on the API endpoint that was called
	match request_type:
		"tags":
			_handle_tags_response(response_code, body)
		_:
			print("!!! %s: Unhandled request type: %s" % [CLIENT_NAME, request_type])

## Handler for the /api/tags endpoint response
func _handle_tags_response(response_code: int, body: PackedByteArray) -> void:
	if response_code != 200:
		print("!!! %s: Model list request failed. Code: %d" % [CLIENT_NAME, response_code])
		# Include a more robust error handling logic here for production
		return

	var json_string = body.get_string_from_utf8()
	var json_result = JSON.parse_string(json_string)

	if json_result is Dictionary and json_result.has("models"):
		print("\n--- Available Ollama Models ---")
		var models: Array = json_result["models"]
		
		for model_dict in models:
			if model_dict is Dictionary and model_dict.has("name"):
				var name = model_dict.get("name", "N/A")
				var size_bytes = model_dict.get("size", 0)
				var size_gb = float(size_bytes) / (1024.0 * 1024.0 * 1024.0)
				
				# Print nicely formatted information
				print("- **%s** (Size: %.2f GB)" % [name, size_gb])
	else:
		print("!!! %s: Failed to parse or unexpected response structure." % CLIENT_NAME)
