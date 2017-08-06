
#pragma glslify: random = require(glsl-random)

#define PI 3.1415926

uniform int mode;
uniform float dt, time;

uniform vec3 emitter;
uniform float radius;

vec3 random_point_on_sphere(vec2 uv) {
    float u = random(uv) * 2.0 - 1.0;
    float theta = random(uv + 0.333) * PI * 2.0;
    float u2 = sqrt(1.0 - u * u);
    return vec3(u2 * cos(theta), u2 * sin(theta), u);
}

void init(vec2 uv) {
    gl_FragColor = vec4(emitter + random_point_on_sphere(uv + vec2(dt, time)) * radius, 1);
}

void update(vec2 uv) {
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);

    float decay = random(vec2(uv.yx));
    pos.w -= dt * (1.0 + 0.5 * decay);

    if(pos.w < 0.0)  {
        init(uv);
    } else {
        pos.xyz += vel.xyz * dt;
        gl_FragColor = pos;
    }
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    if(mode == 0) {
        init(uv);
        gl_FragColor.a = random(uv);
    } else {
        update(uv);
    }
}
