#version 300 es

layout (location = 0) in vec3 aPos;

uniform float x;
uniform float y;

void main() {
    gl_Position = vec4(aPos[0] + x, aPos[1] + y, aPos[2], 1.0);
} 