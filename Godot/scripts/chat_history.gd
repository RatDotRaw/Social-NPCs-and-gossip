extends Control

const ChatMessage: Resource = preload("uid://cfxc5mshstw1t")
@onready var message_container: VBoxContainer = %MessageContainer
@onready var scroll_container: ScrollContainer = %ScrollContainer
var scroll_bar: VScrollBar

func _ready() -> void:
	GS.update_messages.connect(render_new_messages)
	
	scroll_bar = scroll_container.get_v_scroll_bar()
	
	for child in message_container.get_children():
		child.free()

func _process(delta: float) -> void:
	_auto_scroll_down()

func _auto_scroll_down():
	if scroll_bar.value != scroll_bar.max_value:
		scroll_bar.value = scroll_bar.max_value

func render_new_messages(new_entries: Array[Message]):
	for msg in new_entries:
		add_message(msg)

func add_message(message: Message):
	var instance = ChatMessage.instantiate()
	message_container.add_child(instance)
	instance.username = message.participantName
	instance.content = message.content
