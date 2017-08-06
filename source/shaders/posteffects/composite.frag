
#pragma glslify: random = require(glsl-random)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

uniform float time;
uniform vec2 resolution;
uniform sampler2D tDiffuse, tBlur;
uniform samplerCube tEnv;

uniform vec2 noiseOffset;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tBlur, vUv);
    float depth = color.z;

    vec3 normal = normalize(vec3(color.rg - 0.5, sin(time * 0.2)));
    color.rgb = textureCube(tEnv, normal).rgb * color.a * depth;
    // color.rgb = vec3(depth, depth, depth); // debug depth

    float whiteNoise = random(vUv + noiseOffset);
    color.rgb *= vec3(1. - whiteNoise * 0.15);
    
    gl_FragColor = color;
}
