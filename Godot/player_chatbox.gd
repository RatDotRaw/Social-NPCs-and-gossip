extends Node

@onready var text_edit: TextEdit = %TextEdit
@onready var confirm_btn: TextureButton = %ConfirmBtn

func _ready() -> void:
	confirm_btn.connect("pressed", send_message)

func send_message():
	var messge: Message = Message.new(text_edit.text, "user", "You")
	print("Creating new user messge:", messge.contents)
	#ApiClient.send_court_message(messge)
	GS.new_user_message(messge)
	pass
