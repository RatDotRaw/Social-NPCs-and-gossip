extends MarginContainer
class_name CourtInfoBook

@export var court_participants: CourtParticipants

@onready var pfp_1: TextureRect = %PFP1
@onready var pfp_2: TextureRect = %PFP2
@onready var pfp_3: TextureRect = %PFP3
@onready var name_plate_1: RichTextLabel = %NamePlate1
@onready var name_plate_2: RichTextLabel = %NamePlate2
@onready var name_plate_3: RichTextLabel = %NamePlate3
@onready var date_plate_1: RichTextLabel = %DatePlate1
@onready var date_plate_2: RichTextLabel = %DatePlate2
@onready var date_plate_3: RichTextLabel = %DatePlate3
@onready var likes_label_1: RichTextLabel = %LikesLabel1
@onready var likes_label_2: RichTextLabel = %LikesLabel2
@onready var likes_label_3: RichTextLabel = %LikesLabel3

func _ready() -> void:
	assert(court_participants is CourtParticipants, "CourtParticipants resource not assigned")
	court_participants.participant_1_changed.connect(_on_participant_changed)
	court_participants.participant_2_changed.connect(_on_participant_changed)
	court_participants.participant_3_changed.connect(_on_participant_changed)
	_update_ui()

func _on_participant_changed(_value: Participant) -> void:
	_update_ui()

func _update_ui() -> void:
	var participants := [court_participants.participant_1, court_participants.participant_2, court_participants.participant_3]
	var pfp := [pfp_1, pfp_2, pfp_3]
	var name_plates := [name_plate_1, name_plate_2, name_plate_3]
	var date_plates := [date_plate_1, date_plate_2, date_plate_3]
	var likes_labels := [likes_label_1, likes_label_2, likes_label_3]
	
	for i in range(3):
		var p = participants[i]
		if p is Participant:
			pfp[i].texture = p.icon
			name_plates[i].text = "[b]" + p.character_name
			date_plates[i].text = "[b]" + p.birth_date
			likes_labels[i].text = p.likes
