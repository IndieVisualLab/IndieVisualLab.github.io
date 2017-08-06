precision mediump float;
precision mediump int;

uniform sampler2D textureParticle;

varying vec2 vUv;

void main() {
    vec2 uv = gl_PointCoord;
    const vec2 center = vec2(0.5, 0.5);
    vec2 dir = uv - center;
    vec2 normal = normalize(dir);
    float l = length(dir);
    float alpha = max(0.5 - l, 0.0) * 2.0;
    gl_FragColor = vec4(normal, 0.0, alpha);
}
