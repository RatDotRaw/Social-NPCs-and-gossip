extends Control

@onready var animation_player: AnimationPlayer = %AnimationPlayer
@onready var rich_text_label: RichTextLabel = %RichTextLabel

func set_label(text: String) -> void:
	rich_text_label.text = text

## close and free the popup
func close_popup() -> void:
	animation_player.play("Outro")
	await animation_player.animation_finished
	queue_free()
