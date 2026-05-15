extends MarginContainer

@onready var texture_rect: TextureRect = %TextureRect

@export var username: String:
	get:
		return username
	set(val):
		name_label.text = str(val)
		username = val
@export var content: String:
	get:
		return username
	set(val):
		rich_text_label.text = str(val)
		content = val

@export var image: Texture2D:
	get:
		return image
	set(texture):
		texture_rect.texture = texture
		image = texture

@onready var name_label: Label = %NameLabel
@onready var rich_text_label: RichTextLabel = %RichTextLabel
