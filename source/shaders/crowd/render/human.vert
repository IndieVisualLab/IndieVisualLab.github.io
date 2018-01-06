precision mediump float;
precision mediump int;

#ifndef PI
#define PI 3.1415926
#endif

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;

uniform mat4 boneMatrices[MAX_BONES];
uniform mat4 bindMatrix, bindMatrixInverse;
uniform sampler2D texturePosition, textureRotation;
uniform vec2 sections;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv, uv2;
attribute vec3 skinIndex, skinWeight;

varying vec3 vNormal;
varying vec3 vColor;

mat4 getMatrixFromQuat(const in vec4 quat) {
    mat4 m = mat4(vec4(0), vec4(0), vec4(0), vec4(0));

    float x = quat.x, y = quat.y, z = quat.z, w = quat.w;
    float x2 = x + x, y2 = y + y, z2 = z + z;
    float xx = x * x2, xy = x * y2, xz = x * z2;
    float yy = y * y2, yz = y * z2, zz = z * z2;
    float wx = w * x2, wy = w * y2, wz = w * z2;

    /*
    m[0] = 1.0 - (yy + zz);
    m[4] = xy - wz;
    m[8] = xz + wy;

    m[1] = xy + wz;
    m[5] = 1.0 - (xx + zz);
    m[9] = yz - wx;

    m[2] = xz - wy;
    m[6] = yz + wx;
    m[10] = 1.0 - (xx + yy);

    m[15] = 1.0;
    */

    m[0][0] = 1.0 - (yy + zz);
    m[1][0] = xy - wz;
    m[2][0] = xz + wy;

    m[0][1] = xy + wz;
    m[1][1] = 1.0 - (xx + zz);
    m[2][1] = yz - wx;

    m[0][2] = xz - wy;
    m[1][2] = yz + wx;
    m[2][2] = 1.0 - (xx + yy);

    m[3][3] = 1.0;

    return m;
}

mat4 getBoneMatrix(const in float i) {
    float u = i * sections.y;
    vec4 pos = texture2D(texturePosition, vec2(u, uv2.y));
    vec4 rot = texture2D(textureRotation, vec2(u, uv2.y));

    // mat4 bone = boneMatrices[ int(i) ];
    // mat4 bone = mat4(vec4(0, 0, 0, 1), vec4(0, 0, 0, 1), vec4(0, 0, 0, 1), vec4(0, 0, 0, 1));
    // mat4 bone = mat4(vec4(1, 0, 0, 0), vec4(0, 1, 0, 0), vec4(0, 0, 1, 0), vec4(pos.xyz, 1));
    // return bone;

    mat4 T = mat4(vec4(1, 0, 0, 0), vec4(0, 1, 0, 0), vec4(0, 0, 1, 0), vec4(pos.xyz, 1));
    mat4 R = getMatrixFromQuat(rot);
    // return R * T;
    return T * R;
}

void getSkinned(inout vec3 vertex, inout vec3 normal) {
	mat4 boneMatX = getBoneMatrix(skinIndex.x);
	mat4 boneMatY = getBoneMatrix(skinIndex.y);
	// mat4 boneMatZ = getBoneMatrix(skinIndex.z);

	vec4 skinVertex = bindMatrix * vec4(vertex, 1.0);
    vec4 skinned = vec4(0.0);
    skinned += boneMatX * skinVertex * skinWeight.x;
    skinned += boneMatY * skinVertex * skinWeight.y;
    // skinned += boneMatZ * skinVertex * skinWeight.z;
	vertex.xyz = (bindMatrixInverse * skinned).xyz;

    mat4 skinMatrix = mat4(0.0);
    skinMatrix += skinWeight.x * boneMatX;
    skinMatrix += skinWeight.y * boneMatY;
    // skinMatrix += skinWeight.z * boneMatZ;
    skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
    normal.xyz = vec4(skinMatrix * vec4(normal, 0.0)).xyz;
}

void main() {
    vec3 transformed = position.xyz, transformedNormal = normal;
    getSkinned(transformed, transformedNormal);

    gl_Position = projectionMatrix * (modelViewMatrix * vec4(transformed, 1.0));
    vNormal = transformedNormal;
    // vColor = skinWeight;
    vColor = vec3(0, 1, 0);
}

