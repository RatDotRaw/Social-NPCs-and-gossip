extends Resource
class_name CourtParticipants

signal participant_1_changed(value: Participant)
signal participant_2_changed(value: Participant)
signal participant_3_changed(value: Participant)

@export var participant_1: Participant:
	set(value):
		participant_1 = value
		participant_1_changed.emit(value)
@export var participant_2: Participant:
	set(value):
		participant_2 = value
		participant_2_changed.emit(value)
@export var participant_3: Participant:
	set(value):
		participant_3 = value
		participant_3_changed.emit(value)
