extends Resource
class_name Message

var contents = {
	"uuid": "",
	#"bufferName": '',
	"content": "",
	"role": "",
	"participantName": ""
}

var uuid: String:
	set(val):
		uuid = val
		contents.uuid = val
var content: String:
	set(val):
		content=val
		contents.content = val
var role: String:
	set(val):
		role=val
		contents.role = val
var participantName: String:
	set(val):
		participantName=val
		contents.participantName = val

func _init(newContent: String, newRole: String, newParticipantName: String, newId: String = "") -> void:
	content = newContent
	role = newRole
	participantName = newParticipantName
	if not newId == "":
		uuid = newId
	else:
		uuid = str(get_instance_id())
	#print("content:", contents)

func to_object():
	return contents
