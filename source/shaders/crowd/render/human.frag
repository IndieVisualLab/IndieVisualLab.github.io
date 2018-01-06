precision mediump float;
precision mediump int;

varying vec3 vNormal;
varying vec3 vColor;

void main() {
    vec3 color = vColor * ((vNormal + 1.0) * 0.5);
    gl_FragColor = vec4(color, 1.0);
}

