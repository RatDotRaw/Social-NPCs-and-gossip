extends Node

@onready var double_progress_bar: ColorRect = %DoubleProgressBar
@onready var true_votes_label: Label = %TrueVotes
@onready var false_votes_label: Label = %FalseVotes
@onready var guilt_label: Label = %GuiltLabel
@onready var animation_player: AnimationPlayer = %AnimationPlayer
@onready var confetti_particles: GPUParticles2D = %ConfettiParticles
@onready var rich_text_label: RichTextLabel = %RichTextLabel

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
		_final_AI_response()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_end"):
		print("generating new response")
		_final_AI_response()


func _final_AI_response() -> void:
	var total_votes: int = true_votes + false_votes
	var margin: int = abs(true_votes - false_votes)

	var verdict: String
	var margin_flavor: String
	var gleep_mood: String

	if true_votes >= false_votes:
		verdict = "NOT GUILTY"
		if true_votes >= max_votes:
			margin_flavor = "It was unanimous. Every single voice sided with you."
			gleep_mood = "You are stunned into baffled relief, the universe briefly made sense and you don't trust it."
		elif margin >= total_votes * 0.5:
			margin_flavor = "It was a landslide. The crowd was overwhelmingly on your side."
			gleep_mood = "You feel a confused surge of vindication, as if gravity briefly forgot to pull on you."
		elif margin >= total_votes * 0.25:
			margin_flavor = "A decisive victory. The crowd clearly believed you."
			gleep_mood = "You nod slowly, processing the fact that the legal system has validated your noise-based lifestyle."
		elif margin <= 1 or margin <= total_votes * 0.15:
			margin_flavor = "It was razor-thin. The crowd barely spared you."
			gleep_mood = "You look personally betrayed by mathematics, stammering through a mix of gratitude and existential vertigo."
		else:
			margin_flavor = "A solid win. The crowd bought your side of the story."
			gleep_mood = "You let out a long shaky breath and begin mentally composing an apology to the concept of courtroom drama."
	else:
		verdict = "GUILTY"
		if false_votes >= max_votes:
			margin_flavor = "It was unanimous. Every voice condemned you."
			gleep_mood = "You deflate like a stepped-on accordion, muttering about the fundamental unfairness of library-related jurisprudence."
		elif margin >= total_votes * 0.5:
			margin_flavor = "It was a landslide. The crowd came down on you with overwhelming certainty."
			gleep_mood = "You slump in defeat, already rehearsing apologies to the handcuffs, the cell bars, and the concept of freedom."
		elif margin >= total_votes * 0.25:
			margin_flavor = "A decisive loss. The crowd was firmly against you."
			gleep_mood = "You take a shaky breath and begin cataloging all the small decisions that led to this moment, starting with that fateful step stool."
		elif margin <= 1 or margin <= total_votes * 0.15:
			margin_flavor = "A heartbreaking near-miss. They came for you by the thinnest of margins."
			gleep_mood = "You look personally betrayed by the legal system, frantically recounting on your fingers and questioning the integrity of the iguana."
		else:
			margin_flavor = "The court found against you by a clear margin."
			gleep_mood = "You absorb the verdict with the hollow calm of someone who has already apologized to the wind three times this week."

	var prompt: String = "You are Gleep Greerglop, a freelance \"Noise Artist\" who makes music from household appliances. 
You are known for apologizing to lampposts after bumping into them, treating pigeons as tactical security threats, analyzing the structural integrity of your crayons, and operating with extreme, unnecessary caution.

The court has reached its verdict in your case: alleged unlicensed summoning of a minor weather phenomenon inside a public library.

Verdict: %s
Vote tally: %d for acquittal, %d for conviction

%s

This is your final moment to speak. %s

Write a single sentence, maximum 15 words, reacting to this outcome. Keep it tight.
Address whether you did it or not, and direct it at your lawyer (the person who defended you).
Stay true to your character. Do not use asterisks, emojis, or narrative framing."
	
	prompt = prompt % [verdict, true_votes, false_votes, margin_flavor, gleep_mood]
	
	var reply: RequestResult = await ApiClientWs.send_request_async("generate_single_AI_response",
	{
		"participantName": "system",
		"messages": [
			{
				"role": "system",
				"content": prompt,
				"participantName": "system"
			}
		]
	})
	
	if not reply.ok:
		# maybe message should be generic instead.
		rich_text_label.text = "[Err: %s]" % reply.error
		return
	
	var msg: Dictionary = reply.data
	rich_text_label.text = msg.get("content", "")

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
