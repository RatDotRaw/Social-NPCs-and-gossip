extends Resource
class_name Message

var contents = {
	"uuid": "",
	#"bufferName": '',
	"content": "",
	"role": "",
	"participantName": ""
}

var content: String:
	get:
		return content
	set(val):
		content=val
		contents.content = val
var role: String:
	get:
		return role
	set(val):
		role=val
		contents.role = val
var participantName: String:
	get:
		return participantName
	set(val):
		participantName=val
		contents.participantName = val
var uuid: String:
	get:
		return uuid
	set(val):
		uuid = val
		contents.uuid = val

func _init(newContent: String, newRole: String, newUsername: String, newId: String = "") -> void:
	content = newContent
	role = newRole
	participantName = newUsername
	if not newId == "":
		uuid = newId
	else:
		uuid = str(get_instance_id())
	#print("content:", contents)

func to_object():
	return contents
