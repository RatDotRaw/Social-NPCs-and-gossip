extends Control

const ChatMessage: Resource = preload("uid://brm636resl3ne")
@onready var message_container: VBoxContainer = %MessageContainer
@onready var scroll_container: ScrollContainer = %ScrollContainer
var scroll_bar: VScrollBar

func _ready() -> void:
	rerender_messages()
	MsgM.gossip_buffer_update.connect(rerender_messages)
	scroll_bar = scroll_container.get_v_scroll_bar()

#func _process(delta: float) -> void:
	#_auto_scroll_down()

func _auto_scroll_down():
	if scroll_bar.value != scroll_bar.max_value:
		scroll_bar.value = scroll_bar.max_value

## R
func rerender_messages(_gossip: Gossip = Gossip.new()):
	for child in message_container.get_children():
		child.queue_free()
	
	for msg: Gossip in MsgM.gossip_buffer:
		var msgBox = ChatMessage.instantiate()
		message_container.add_child(msgBox)
		msgBox.username = msg.parent_id
		msgBox.content = msg.content
		msgBox.believe = msg.belief
		

func render_message(message: Message):
	var instance = ChatMessage.instantiate()
	message_container.add_child(instance)
	instance.username = message.participantName
	instance.content = message.content
