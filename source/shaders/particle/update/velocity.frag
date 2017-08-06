
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: random = require(glsl-random)

uniform int mode;
uniform float dt, time, speed;

uniform vec3 point;
uniform float force;

const float seedScale = 100.0;

void init() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    float r = random(uv);
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.8 + 0.1 * r);
}

vec3 snoiseVec3 (vec3 x){
    float s = snoise3(vec3(x));
    float s1 = snoise3(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
    float s2 = snoise3(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
    vec3 c = vec3(s, s1, s2);
    return c;
}

vec3 curlNoise(vec3 p) {
    const float e = 0.0009765625;

    vec3 dx = vec3(e, 0, 0);
    vec3 dy = vec3(0, e, 0);
    vec3 dz = vec3(0, 0, e);

    vec3 p_x0 = snoiseVec3(p - dx);
    vec3 p_x1 = snoiseVec3(p + dx);
    vec3 p_y0 = snoiseVec3(p - dy);
    vec3 p_y1 = snoiseVec3(p + dy);
    vec3 p_z0 = snoiseVec3(p - dz);
    vec3 p_z1 = snoiseVec3(p + dz);

    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

    const float divisor = 1.0 / (2.0 * e);
    return normalize(vec3(x, y, z) * divisor);
}

void update() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 pos = texture2D(texturePosition, uv);
    if(pos.w < 0.0) {
        init();
    } else {
        vec4 vel = texture2D(textureVelocity, uv);
        vel.xyz *= vel.w;
        vel.xyz += speed * dt * curlNoise(pos.xyz + vec3(0, time, 0));

        vec3 dir = pos.xyz - point;
        float l = length(dir);
        vel.xyz += (1.0 - l) * normalize(dir) * force;

        gl_FragColor = vel;
    }
}

void main() {
    if(mode == 0) {
        init();
    } else {
        update();
    }
}
