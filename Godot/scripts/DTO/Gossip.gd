extends Resource
class_name Gossip

var contents = {
	"id": "",
	"content": "",
	"belief": false,
	"reason": "",
	"parent_id": "",
	"persona_id": "",
	"timestamp": null
}

var id: String:
	set(val):
		id = val
		contents.id = val
var content: String:
	set(val):
		content = val
		contents.content = val
var belief: bool:
	set(val):
		belief = val
		contents.belief = val
var reason: String:
	set(val):
		reason = val
		contents.reason = val
var parent_id: String:
	set(val):
		parent_id = val
		contents.parent_id = val
var persona_id: String:
	set(val):
		persona_id = val
		contents.persona_id = val
var timestamp:
	set(val):
		timestamp = val
		contents.timestamp = val

func _init(newId: String = "", newContent: String = "", newBelief: bool = false, newReason: String = "", newParentId: String = "", newPersonaId: String = "", newTimestamp = null) -> void:
	if not newId == "":
		id = newId
	else:
		id = str(get_instance_id())
	content = newContent
	belief = newBelief
	reason = newReason
	parent_id = newParentId
	persona_id = newPersonaId
	timestamp = newTimestamp

func to_object():
	return contents
