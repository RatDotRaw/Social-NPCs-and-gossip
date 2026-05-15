extends Sprite3D

@onready var persona_pfp: TextureRect = %PersonaPfp

func set_image(textute: Texture2D) -> void:
	persona_pfp.texture = textute
