
#pragma glslify: random = require(glsl-random)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

#define PI 3.1415926

uniform int mode;
uniform float dt, time, speed;
uniform vec2 sections;
uniform sampler2D textureVelocity;

void init() {
}

void update() {
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 pos = texture2D(texturePosition, uv);
    bool head = (uv.x < sections.y);
    if(head) {
        vec4 vel = texture2D(textureVelocity, vec2(0.5, uv.y));
        // gl_FragColor = vec4(mix(pos.xyz, pos.xyz + vel.xyz * dt, dt), 1);
        // gl_FragColor = vec4(pos.xyz + vel.xyz * dt * speed, 1);

        vec3 next = vel.xyz * dt * speed;
        gl_FragColor = vec4(pos.xyz + next, 1);

    } else {
        float prev = uv.x - sections.y;
        vec4 pp = texture2D(texturePosition, vec2(prev, uv.y));
        // float near = 1.0 - uv.x;
        // gl_FragColor = vec4(mix(pos.xyz, pp.xyz, min(dt + 10.0 * near * dt, 1.0)), 1.0);
        gl_FragColor = vec4(mix(pos.xyz, pp.xyz, min(dt, 1.0)), 1.0);
    }
}
