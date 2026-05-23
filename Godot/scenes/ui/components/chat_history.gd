extends Control

const ChatMessage: Resource = preload("uid://cfxc5mshstw1t")
@onready var message_container: VBoxContainer = %MessageContainer
@onready var scroll_container: ScrollContainer = %ScrollContainer
var scroll_bar: VScrollBar

func _ready() -> void:
	MsgM.buffer_update.connect(rerender_messages)
	
	scroll_bar = scroll_container.get_v_scroll_bar()
	
	for child in message_container.get_children():
		child.queue_free()


func _auto_scroll_down():
	scroll_bar.value = scroll_bar.max_value

## R
func rerender_messages(bufferName: String):
	for child in message_container.get_children():
		child.queue_free()
	
	for msg in MsgM.get_buffer(bufferName):
		msg = msg as Message
		if (msg.role == "tool" or msg.role == "system"):
			continue
		
		var participant: Participant = PM.get_participant(msg.participantName)
		if participant == null:
			printerr("Participant not found by name:", msg.participantName)
			continue
		var msgBox = ChatMessage.instantiate()
		print("msg; ", msg.participantName)
		print("participant: ", participant.character_name)
		
		message_container.add_child(msgBox)
		await get_tree().process_frame # wait 1 frame to make sure msBox exists in tree

		msgBox.username = participant.character_name
		msgBox.image = participant.icon
		msgBox.content = msg.content
	_auto_scroll_down()

func render_message(message: Message):
	var instance = ChatMessage.instantiate()
	message_container.add_child(instance)
	instance.username = message.participantName
	instance.content = message.content
