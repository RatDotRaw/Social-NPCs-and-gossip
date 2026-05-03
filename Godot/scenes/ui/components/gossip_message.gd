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
@export var believe: bool:
	set(val):
		believe_label.text = str(val)
		believe = val

@export var image: String:
	get:
		return image
	set(path):
		var test: Texture2D = Texture2D.new()
		texture_rect.texture = load(path)
		image = path

@onready var name_label: Label = %NameLabel
@onready var rich_text_label: RichTextLabel = %RichTextLabel
@onready var believe_label: Label = %BelieveLabel
