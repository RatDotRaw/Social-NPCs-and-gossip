shader_type canvas_item;

uniform float progress_value : hint_range(0.0, 1.0, 0.1);
uniform float reverse_progress_value : hint_range(0.0, 1.0, 0.1);
uniform sampler2D under : source_color, hint_default_transparent;
uniform sampler2D over : source_color, hint_default_transparent;
uniform sampler2D progress_visual_left : source_color, hint_default_transparent;
uniform sampler2D progress_visual_right : source_color, hint_default_transparent;

void fragment() {
	vec4 final_color = texture(under, UV);
	vec4 over_texture = texture(over, UV);
	vec4 left_texture = texture(progress_visual_left, UV);
	vec4 right_texture = texture(progress_visual_right, UV);
	
	// make masks and masking
	float left_mask = step(UV.x, progress_value);
	float right_mask = step(1. - UV.x, reverse_progress_value);
	final_color = mix(final_color, left_texture, left_mask * left_texture.a);
	final_color = mix(final_color, right_texture, right_mask * right_texture.a);
	
	final_color = mix(final_color, over_texture, over_texture.a);
	
	COLOR = final_color;
	
}
