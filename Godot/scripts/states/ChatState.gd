extends Control
class_name ChatState

@export var text_input: TextEdit
@export var max_chat_turns: int = 10
var chat_turns_left: int = max_chat_turns

signal message_send()

#region message shenanigans
func send_message() -> bool:
	if chat_turns_left == 0:
		return false
	if not GS.allow_new_user_message:
		return false # TODO: notify player
	if not GS.current_chat_room:
		printerr("No `GS.current_chat_room` set")
		return false
	
	var user_text: String = text_input.text
	if not user_text or user_text == '':
		print('message canceled: "', user_text, '"')
		return false
	print("player text input: '", user_text, "'")
	
	var messge: Message = Message.new(user_text, "user", "You")
	if MsgM.new_user_message(messge):
		print("Creating new user messge:", messge.contents)
		chat_turns_left -= 1
	else:
		printerr("GS did not accept new user message")
		return false
	return true
#endregion
