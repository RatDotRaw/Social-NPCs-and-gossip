extends Node
class_name GameState

var sessionID: String

signal update_messages(message: Message)

var court_messages: Array[Message] = []

func add_message(msg: Message):
	assert(msg, "No message recieved")
	print("message:", msg.contents)
	court_messages.append(msg)
	update_messages.emit(msg)
