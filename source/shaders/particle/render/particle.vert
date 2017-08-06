precision mediump float;
precision mediump int;

#pragma glslify: random = require(glsl-random)

#define PI 3.1415926

vec3 random_point_on_sphere(vec2 uv) {
    float u = random(uv) * 2.0 - 1.0;
    float theta = random(uv + 0.333) * PI * 2.0;
    float u2 = sqrt(1.0 - u * u);
    return vec3(u2 * cos(theta), u2 * sin(theta), u);
}

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;

uniform sampler2D texturePosition, textureVelocity;
uniform float size;

attribute vec3 position;
attribute vec2 uv;

varying float vDepth;

void main() {
    vec4 pos = texture2D(texturePosition, uv);

    vec4 mvPosition = (modelViewMatrix * vec4(pos.xyz, 1.0));
    gl_Position = projectionMatrix * mvPosition;

    float s = smoothstep(0.0, 0.3, pos.w) * smoothstep(1.0, 0.8, pos.w);
    gl_PointSize = size * s;

    vDepth = gl_Position.z / gl_Position.w;
}
