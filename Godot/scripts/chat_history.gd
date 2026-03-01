extends Control

const ChatMessage: Resource = preload("uid://cfxc5mshstw1t")
@onready var message_container: VBoxContainer = %MessageContainer
@onready var scroll_container: ScrollContainer = %ScrollContainer
var scroll_bar: VScrollBar

func _ready() -> void:
	MsgM.buffer_update.connect(rerender_messages)
	
	scroll_bar = scroll_container.get_v_scroll_bar()
	
	for child in message_container.get_children():
		child.free() 

func _process(delta: float) -> void:
	_auto_scroll_down()

func _auto_scroll_down():
	if scroll_bar.value != scroll_bar.max_value:
		scroll_bar.value = scroll_bar.max_value

## R
func rerender_messages(bufferName: String):
	for child in message_container.get_children():
		child.free()
	
	for msg in MsgM.get_buffer(bufferName):
		var msgBox = ChatMessage.instantiate()
		message_container.add_child(msgBox)
		msgBox.username = msg.participantName
		msgBox.content = msg.content

func add_message(message: Message):
	var instance = ChatMessage.instantiate()
	message_container.add_child(instance)
	instance.username = message.participantName
	instance.content = message.content
