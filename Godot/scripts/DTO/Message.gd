extends Resource
class_name Message

var contents = {
	"content": "",
	"role": "",
	"username": ""
}

var role: String:
	get:
		return role
	set(val):
		role=val
		contents.role = val
var username: String:
	get:
		return username
	set(val):
		username=val
		contents.username = val
var content: String:
	get:
		return content
	set(val):
		content=val
		contents.content = val

func _init(newContent: String, newRole: String, newUsername: String) -> void:
	content = newContent
	role = newRole
	username = newUsername
	#print("content:", contents)

func to_object():
	return contents
