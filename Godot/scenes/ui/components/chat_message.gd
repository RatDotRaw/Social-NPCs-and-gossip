extends MarginContainer

@onready var name_label: Label = %NameLabel
@onready var rich_text_label: RichTextLabel = %RichTextLabel
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
		if not texture_rect: return # is sometimes nil for some reason
		if texture and texture is Texture2D:
			texture_rect.texture = texture
		image = texture
