precision mediump float;
precision mediump int;

uniform sampler2D textureParticle;

varying float vDepth;

float gaussian(float x) {
    return exp(- (x * x) / 2.0);
}

void main() {
    vec2 uv = gl_PointCoord;
    
    const vec2 center = vec2(0.5, 0.5);
    float l = length(uv - center);
    // float alpha = max(0.5 - l, 0.0) * 2.0;
    float alpha = 0.5 - l;
    if(alpha <= 0.0) discard;

    vec3 normal = (normalize(vec3(mix(-1.0, 1.0, uv.x), mix(-1.0, 1.0, uv.y), 1.0)) + 1.0) * 0.5;
    // gl_FragColor = vec4(normal * vDepth, gaussian(l * 2.0));
    gl_FragColor = vec4(normal.xy * vDepth, vDepth, gaussian(l * 2.0));
}
