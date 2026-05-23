extends Node
@onready var audio_stream_player: AudioStreamPlayer = $AudioStreamPlayer

func _ready() -> void:
	audio_stream_player.play()
	#audio_stream_player.finished(func (): audio_stream_player.play())
