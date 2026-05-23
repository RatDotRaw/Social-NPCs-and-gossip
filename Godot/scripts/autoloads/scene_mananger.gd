extends Node

var target_scene: String = ''
var loading_status = null
var progress : Array[float]

var allow_switch: bool = true

func switch_scene(path: String, auto_switch: bool = true) -> void:
	target_scene = path
	allow_switch = auto_switch
	ResourceLoader.load_threaded_request(target_scene)
	loading_status = 'THREAD_LOAD_IN_PROGRESS'

func switch_scene_with_loading(path: String, loading_scene: String, auto_switch: bool = true) -> void:
	var instance = load("res://scenes/loading_screen.tscn").instantiate()
	get_tree().current_scene.add_child(instance)
	switch_scene(path, auto_switch)

func switch_now() -> void:
	allow_switch = true
	if target_scene == '':
		push_warning("[LoadingManager] switch_now() called with no scene in flight")

func _process(_delta: float) -> void:
	if loading_status == null:
		return
	loading_status = ResourceLoader.load_threaded_get_status(target_scene, progress)
	match loading_status:
		ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			pass  # hook progress[0] here if you add a progress bar later
		ResourceLoader.THREAD_LOAD_LOADED:
			if allow_switch:
				loading_status = null
				get_tree().change_scene_to_packed(ResourceLoader.load_threaded_get(target_scene))
		ResourceLoader.THREAD_LOAD_FAILED:
			push_error("[LoadingManager] Failed to load: %s" % target_scene)
			loading_status = null
			assert(false, "LoadingManager: could not load '%s'" % target_scene)
