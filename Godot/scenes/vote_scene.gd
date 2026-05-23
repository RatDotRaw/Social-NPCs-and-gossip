extends Node

@onready var double_progress_bar: ColorRect = %DoubleProgressBar
@onready var true_votes_label: Label = %TrueVotes
@onready var false_votes_label: Label = %FalseVotes
@onready var guilt_label: Label = %GuiltLabel
@onready var animation_player: AnimationPlayer = %AnimationPlayer
@onready var confetti_particles: GPUParticles2D = %ConfettiParticles

var max_votes: int = 1
var true_votes: int = 0
var false_votes: int = 0

func _ready() -> void:
	confetti_particles.emitting = false
	_update_duble_progressBar()
	
	max_votes = GS.gossipEngine_config.get("maxHops", 1) -3 # -3 seed gossips from the judges
	
	GS.gossipEngine_config_update.connect(_setup_ratios)
	MsgM.gossip_buffer_update.connect(_count_scores)

func _setup_ratios(gossipEninge_config: Dictionary) -> void:
	max_votes = gossipEninge_config.get("maxHops", 1) -3 # -3 seed gossips from the judges
	print("maamasdmmamd", max_votes)

func _count_scores(gossip: Gossip) -> void:
	if gossip.belief:
		true_votes += 1
	else:
		false_votes += 1
	print(true_votes, false_votes,)
	_update_duble_progressBar()
	
	if (true_votes+false_votes >= max_votes):
		_results_animatios()

func _results_animatios() -> void:
	if (true_votes >= false_votes):
		guilt_label.text = "not guilty"
		confetti_particles.emitting = true
	else:
		guilt_label.text = "guilty"
		animation_player.play("put_in_jail")

func _update_duble_progressBar() -> void:
	true_votes_label.text = str(true_votes)
	false_votes_label.text = str(false_votes)
	double_progress_bar.material.set_shader_parameter("progress_value", float(true_votes)/float(max_votes))
	double_progress_bar.material.set_shader_parameter("reverse_progress_value", float(false_votes)/float(max_votes))
