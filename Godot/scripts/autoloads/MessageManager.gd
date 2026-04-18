extends Node
class_name MessageManager

var MessageBuffers: Dictionary[String, Array] = {}
var court_messages: Array[Message] = []

signal buffer_update(bufferName: String)

func _ready() -> void:
	buffer_update.connect(func(): print('signal fired'))

## add a message locally
func add_message(bufferName: String, message: Message, create: bool = false) -> bool:
	if not MessageBuffers.find_key(bufferName) == null:
		if not create:
			printerr("Buffer does not exist: ", bufferName)
			return false
		MessageBuffers[bufferName] = []
	var buff: Array = MessageBuffers.get(bufferName)
	buff.append(message)
	buffer_update.emit(bufferName)
	return true

## add a message locally from a dictionary
func add_message_dict(buffername: String, message_dict: Dictionary) -> void:
	var msg: Message = message_dict_to_message(message_dict)
	return add_message(buffername, msg)

## Create new messagen, send to server and request AI response
func new_user_message(msg: Message)-> bool:
	if not GS.allow_server_request or GS.is_ai_bussy:
		return false
	
	#msg.participantName = "You"
	add_message(GS.current_chat_room, msg)
	
	var msg_dict: Dictionary = msg.to_object()
	msg_dict.merge({
		"bufferName": GS.current_chat_room,
	})
	
	#print("and here is where it all went wrong.", msg.to_object())
	ApiClientWs.send_request("add_message",  msg_dict)
	ApiClientWs.send_request("get_status")
	ApiClientWs.send_request(
		"generate_AI_response",
		{
			"bufferName": GS.current_chat_room,
			"participantName": "Malachi-Hope",
			"addRespToBuffer": true
		}
	)
	
	var msgArray: Array[Message] = [msg] # For some reason it needs an exact type
	return true

#region buffer calls
func create_buffer(bufferName: String) -> bool:
	if MessageBuffers.has(bufferName):
		printerr("BufferName already taken:", bufferName)
		return false
	MessageBuffers[bufferName] = []
	ApiClientWs.send_request("create_message_buffer", { "bufferName": bufferName })
	print("buffer created: ", bufferName)
	return true

func get_buffer(bufferName: String) -> Array:
	return MessageBuffers.get(bufferName)

### used for update internal message list with the server's list
func overwrite_buffer(bufferName: String, buffer: Array[Message]) -> bool:
	if not MessageBuffers.find_key(bufferName):
		return false
	MessageBuffers[bufferName] = buffer
	buffer_update.emit(bufferName)
	return true
#endregion

#region gossip calls
func generate_gossip_from_message_buffer(buffer_name: String, persona_id: String) -> bool:
	if MessageBuffers.has(buffer_name) == null:
		return false
	ApiClientWs.send_request('generate_gossip_from_message_buffer', {
		'bufferName': GS.current_chat_room,
		'personaId': persona_id
	})
	return true

#endregion

#region helpers
## Creates a `Message` class out of a dictionary
func message_dict_to_message(message_dict: Dictionary) -> Message:
	assert(message_dict.has('role'), 'Missing key "role"')
	assert(message_dict.has('content'), 'Missing key "content"')

	var p_name = message_dict.get('participantName')
	if p_name == null:
		p_name = message_dict.get('participant').get('name')
	assert(p_name != null, 'Missing "participantName" or "participant.name"')
	
	return Message.new(
		message_dict.get('content'), 
		message_dict.get('role'), 
		p_name
	)
#endregion
