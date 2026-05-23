extends Node
class_name PersonaManager

var Participants: Array[Participant] = [
	preload("uid://chsvdqbtb1frw"), # the player
	preload("res://assets/personas/baby.tres"),
	preload("res://assets/personas/bengel.tres"),
	preload("res://assets/personas/chad.tres"),
	preload("res://assets/personas/devil.tres"),
	preload("res://assets/personas/dr_bones.tres"),
	preload("res://assets/personas/gleep.tres"),
	preload("res://assets/personas/henry.tres"),
	preload("res://assets/personas/john_doe.tres"),
	preload("res://assets/personas/justin_time.tres"),
	preload("res://assets/personas/kasper.tres"),
	preload("res://assets/personas/mr_circle.tres"),
	preload("res://assets/personas/sherlockedin.tres"),
	preload("res://assets/personas/spidery_skitter.tres"),
	preload("res://assets/personas/urkullaaa.tres")
]


func get_participant(name: String) -> Participant:
	for p: Participant in Participants:
		if p.character_name == name:
			return p
	return null

func get_participant_names() -> Array[String]:
	var names: Array[String] = []
	for p: Participant in Participants:
		names.append(p.character_name)
	return names

func get_random_participant() -> Participant:
	var selected = Participants.pick_random()
	while selected.persona_id == "player":
		selected = Participants.pick_random()
	return selected

func get_participant_count() -> int:
	return Participants.size()

func has_participant(name: String) -> bool:
	return get_participant(name) != null

func find_participants_by_persona(query: String) -> Array[Participant]:
	var matches: Array[Participant] = []
	var q: String = query.to_lower()
	for p: Participant in Participants:
		if q in p.persona_id.to_lower():
			matches.append(p)
	return matches
