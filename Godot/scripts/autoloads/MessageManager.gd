extends Node
class_name MessageManager

var MessageBuffers: Dictionary[String, Array] = {}
var gossip_buffer: Array[Gossip] = []

signal buffer_update(bufferName: String)
signal gossip_buffer_update(gossip: Gossip)

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

func add_gossip(gossip: Gossip) -> bool:
	gossip_buffer.append(gossip)
	gossip_buffer_update.emit(gossip)
	return true

func add_gossip_dict(message_dict: Dictionary) -> bool:
	var gossip: Gossip = gossip_dict_to_gossip(message_dict)
	return add_gossip(gossip)

## Create new messagen, send to server and request AI response
func new_user_message(msg: Message)-> bool:
	if not GS.allow_server_request or GS.is_ai_busy:
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
func generate_gossip_from_message_buffer(buffer_name: String, persona_id: String) -> Gossip:
	assert(MessageBuffers.has(buffer_name), "`buffer_name` is missing")
	assert(persona_id, "`persona_id` not set")
	var response: RequestResult = await ApiClientWs.send_request_async('generate_gossip_from_message_buffer', {
		'bufferName': GS.current_chat_room,
		'personaId': persona_id
	})
	
	if response.ok:
		var gossip = Gossip.new()
		gossip.id = response.data.get('id', '')
		gossip.content = response.data.get('content', '')
		var belief_raw = response.data.get('belief', false)
		gossip.belief = belief_raw is String and belief_raw.to_lower() == 'true' or belief_raw is bool and belief_raw
		gossip.reason = response.data.get('reason', '')
		gossip.parent_id = response.data.get('parentId', '')
		gossip.persona_id = persona_id
		gossip.timestamp = Time.get_unix_time_from_system()
		
		gossip_buffer.append(gossip)
		return gossip
	return null

func propagate_gossip(gossip_ids: Array[String]) -> Array[Gossip]:
	assert(gossip_ids.size() > 0, "`gossip_ids` is empty")
	var new_gossip: Array[Gossip] = []
	var response: RequestResult = await ApiClientWs.send_request_async('propagate_gossip', {
		'gossipIds': gossip_ids
	})
	
	if response.ok:
		var gossip_data = response.data
		var gossip = gossip_dict_to_gossip(gossip_data)
		
		gossip_buffer.append(gossip)
		new_gossip.append(gossip)
	return new_gossip
#endregion

#region helpers
## Creates a `Message` class out of a dictionary
func message_dict_to_message(message_dict: Dictionary) -> Message:
	assert(message_dict.has('role'), 'Missing key "role"')
	assert(message_dict.has('content'), 'Missing key "content"')

	var p_name = message_dict.get('participantName', "Unkown")
	if p_name == null:
		p_name = message_dict.get('participant').get('name')
	assert(p_name != null, 'Missing "participantName" or "participant.name"')
	
	return Message.new(
		message_dict.get('content'), 
		message_dict.get('role'), 
		p_name
	)

func gossip_dict_to_gossip(gossip_dict: Dictionary) -> Gossip:
	# Handle both camelCase (server) and snake_case (godot) field names
	var id = gossip_dict.get('id', '')
	var content = gossip_dict.get('content', '')
	
	var belief_raw = gossip_dict.get('belief', true)
	var belief: bool = belief_raw is String and belief_raw.to_lower() == 'true' or belief_raw is bool and belief_raw # holy shit i hate this but hopefully it works
	
	var reason = gossip_dict.get('reason', '')
	var parent_id = gossip_dict.get('parentId', '')
	var persona_id = gossip_dict.get('personaId', '')
	var timestamp = gossip_dict.get('timestamp', null)
	
	# Debug: print what we received if content is missing
	if content == '':
		push_warning("Gossip dict missing 'content' field. Dict: " + str(gossip_dict))
	
	return Gossip.new(
		id,
		content,
		belief,
		reason,
		parent_id,
		persona_id,
		timestamp
	)
#endregion
