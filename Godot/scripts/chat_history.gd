extends Control

const ChatMessage: Resource = preload("uid://cfxc5mshstw1t")
@onready var message_container: VBoxContainer = %MessageContainer

func _ready() -> void:
	GS.update_messages.connect(add_message)
	for child in message_container.get_children():
		child.free()

func add_message(message: Message):
	print(message.contents)
	
	var instance = ChatMessage.instantiate()
	message_container.add_child(instance)
	instance.username = message.username
	instance.content = message.content
