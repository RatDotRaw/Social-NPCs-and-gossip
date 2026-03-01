extends Node
class_name MessageManager

var MessageBuffers: Dictionary[String, Array] = {
	"court": []
} # currently unused, also reffered to as 'buffers'
var court_messages: Array[Message] = []

signal buffer_update(bufferName: String)

func _ready() -> void:
	buffer_update.connect(func(): print('signal fired'))

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

func add_message_dict(buffername: String, message_dict: Dictionary) -> void:
	assert(message_dict.has('role'), 'Missing key "role"')
	assert(message_dict.has('content'), 'Missing key "content"')
	assert(message_dict.has('participant'), 'Missing key "participant"')
	assert(message_dict.get('participant').has('name'), 'Missing key "participant.name"')

	var msg: Message = Message.new(message_dict.get('content'), message_dict.get('role'), message_dict.get('participant').get('name'))
	return add_message(buffername, msg)

#region buffer calls
func create_buffer(bufferName: String) -> bool:
	if MessageBuffers.find_key(bufferName):
		printerr("BufferName already taken:", bufferName)
		return false
	MessageBuffers[bufferName] = []
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

#region helpers
#endregion
