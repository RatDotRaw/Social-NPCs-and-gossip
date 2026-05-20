extends Control

const gossip_message: Resource = preload("uid://brm636resl3ne")
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
		var participant: Participant = PM.find_participants_by_persona(msg.persona_id)[0]
		var msgBox = gossip_message.instantiate()
		message_container.add_child(msgBox)
		await get_tree().process_frame # wait 1 frame to make sure msBox exists in tree
		msgBox.username = participant.character_name
		msgBox.content = msg.content
		msgBox.image = participant.icon

func render_message(message: Message):
	var instance = gossip_message.instantiate()
	message_container.add_child(instance)
	instance.username = message.participantName
	instance.content = message.content
