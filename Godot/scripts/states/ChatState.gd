extends Control
class_name ChatState

@export var text_input: TextEdit
@export var participant: Participant
@export var max_chat_turns: int = 10
var chat_turns_left: int = max_chat_turns

signal message_send(turns_left: int)
signal no_turns_left()

func allow_chat() -> bool:
	var allow: bool = true
	if chat_turns_left == 0:
		allow = false
	if GS.is_ai_busy:
		allow = false # TODO: notify player
	if not GS.current_chat_room:
		printerr("No `GS.current_chat_room` set")
		allow = false
	return allow

#region message shenanigans
func send_message() -> bool:
	if not allow_chat():
		return false
	
	var user_text: String = text_input.text
	if not user_text or user_text == '':
		print('message canceled: "', user_text, '"')
		return false
	print("player text input: '", user_text, "'")
	
	var messge: Message = Message.new(user_text, "user", "You")
	if MsgM.message_and_ai(messge, participant):
		print("Creating new user messge:", messge.contents)
		chat_turns_left -= 1
		message_send.emit(chat_turns_left)
		if (chat_turns_left == 0):
			no_turns_left.emit()
	else:
		printerr("GS did not accept new user message")
		return false
	return true
#endregion
