extends MarginContainer

@onready var name_label: Label = %NameLabel
@onready var continue_btn: TextureButton = %ContinueBtn
@onready var rich_text_label: RichTextLabel = %RichTextLabel
@onready var timer: Timer = %Timer
@onready var audio_stream_player: AudioStreamPlayer = %AudioStreamPlayer

signal next_btn_pressed

# Called when the node enters the scene tree for the first time.
func _ready() -> void:
	timer.timeout.connect(_reveal_text)
	continue_btn.pressed.connect(next_btn_action)

func display_message(msg: Message, auto_start: bool = true) -> void:
	name_label.text = str(msg.participantName)
	rich_text_label.text = str(msg.content)
	
	if auto_start:
		_start_revealing()

func next_btn_action() -> void:
	visible = false
	next_btn_pressed.emit()
	#continue_btn.visible = false

func _start_revealing() -> void:
	visible = true
	rich_text_label.visible_characters = 0
	timer.start()
	#continue_btn.visible = false

func _reveal_text() -> void:
	rich_text_label.visible_characters += 1
	if rich_text_label.visible_characters <= rich_text_label.text.length():
		timer.start()
		if not audio_stream_player.playing:
			audio_stream_player.play()
	#else:
		#continue_btn.visible = true
