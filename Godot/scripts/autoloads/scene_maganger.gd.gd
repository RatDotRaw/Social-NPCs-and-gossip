extends Node

var target_scene = ''
var loading_status = null
var progress : Array[float]

func switch_scene(path: String) -> void:
	ResourceLoader.load_threaded_request(target_scene)
	loading_status = 'THREAD_LOAD_IN_PROGRESS'

func _process(_delta: float) -> void:
	if (loading_status == null):
		return
	
	loading_status = ResourceLoader.load_threaded_get_status(target_scene, progress)
	match loading_status:
		#ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			#progress_bar.value = progress[0] * 100 # Change the ProgressBar value
		ResourceLoader.THREAD_LOAD_LOADED:
			# When done loading, change to the target scene:
			loading_status = null
			get_tree().change_scene_to_packed(ResourceLoader.load_threaded_get(target_scene))
		ResourceLoader.THREAD_LOAD_FAILED:
			# Well some error happend:
			print("Error. Could not load Resource")
