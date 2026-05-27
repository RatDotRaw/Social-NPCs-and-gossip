extends MarginContainer

@onready var name_label: Label = %NameLabel
@onready var rich_text_label: RichTextLabel = %RichTextLabel
@onready var score_label: RichTextLabel = %ScoreLabel
@onready var belief_label: RichTextLabel = %BeliefLabel

@onready var texture_rect: TextureRect = %TextureRect
@onready var nine_patch_rect: NinePatchRect = %NinePatchRect

@export var username: String:
	get:
		return username
	set(val):
		name_label.text = str(val)
		username = val
@export var content: String:
	get:
		return content
	set(val):
		rich_text_label.text = str(val)
		content = val

@export var belief: bool:
	set(val):
		belief = val
		if val == true:
			score_label.text = "+1"
			score_label.set("theme_override_colors/default_color",  Color(0,.5,1,1))
			nine_patch_rect.modulate = Color(0.866, 0.866, 1.0)
		else:
			score_label.text = "-1"
			score_label.set("theme_override_colors/default_color",  Color(1,0,0,1))
			nine_patch_rect.modulate = Color("#ffdcdc")
			

## a custom string for a short message
## ex. x things y is guilty.
@export var belief_string: String:
	set(val):
		belief_label.text = str(val)
		belief_string = val

@export var image: Texture2D:
	get:
		return image
	set(texture):
		if not texture_rect: return # is sometimes nil for some reason
		if texture and texture is Texture2D:
			texture_rect.texture = texture
		image = texture
