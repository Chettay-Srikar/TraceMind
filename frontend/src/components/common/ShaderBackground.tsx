import React, { useEffect, useRef } from 'react';

const VS = `
attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FS = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec2 v_texCoord;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 st = (uv - 0.5) * aspect;

    vec2 mouseNorm = (u_mouse / u_resolution - 0.5) * aspect;
    float distToMouse = length(st - mouseNorm);
    float mouseGlow = smoothstep(0.55, 0.0, distToMouse) * 0.4;

    vec3 bgBase = vec3(0.02, 0.035, 0.06);
    vec3 bgVignette = vec3(0.008, 0.015, 0.025);
    float vignette = length(uv - 0.5);
    vec3 color = mix(bgBase, bgVignette, clamp(vignette * 1.3, 0.0, 1.0));

    vec2 gridScale = vec2(36.0, 20.0);
    vec2 gridUV = fract(uv * gridScale);
    float lineThickness = 0.03;
    float gridLineX = smoothstep(lineThickness, 0.0, abs(gridUV.x - 0.5));
    float gridLineY = smoothstep(lineThickness, 0.0, abs(gridUV.y - 0.5));
    float grid = max(gridLineX, gridLineY) * 0.07;
    float dots = smoothstep(0.12, 0.02, length(gridUV - 0.5)) * 0.12;

    float t = u_time * 0.4;
    float wave1 = sin(st.x * 2.5 + t + sin(st.y * 2.0 + t * 0.7)) * 0.5 + 0.5;
    float wave2 = cos(st.y * 3.0 - t * 0.8 + cos(st.x * 2.2 + t * 0.5)) * 0.5 + 0.5;
    float wave = pow(wave1 * wave2, 1.8);

    float pulseY = sin(u_time * 0.8) * 0.35;
    float pulseBeam = smoothstep(0.08, 0.0, abs(st.y - pulseY + sin(st.x * 4.0 + u_time * 1.2) * 0.05));
    pulseBeam *= (sin(st.x * 12.0 + u_time * 4.0) * 0.5 + 0.5);

    vec3 greenSignal  = vec3(0.0, 1.0, 0.6);
    vec3 cyanSignal   = vec3(0.0, 0.85, 0.7);
    vec3 mintAccent   = vec3(0.13, 1.0, 0.5);

    vec3 ambientGlow = mix(cyanSignal, greenSignal, sin(st.x * 2.0 + t) * 0.5 + 0.5) * wave * 0.55;

    float centerRadial = smoothstep(0.65, 0.05, length(st - vec2(0.0, 0.05)));
    vec3 centerHalo = greenSignal * centerRadial * 0.22;

    vec3 mouseTint = mix(greenSignal, mintAccent, 0.4) * mouseGlow;

    color += (grid + dots) * vec3(0.05, 0.7, 0.45);
    color += ambientGlow;
    color += centerHalo;
    color += pulseBeam * greenSignal * 0.65;
    color += mouseTint;

    gl_FragColor = vec4(color, 1.0);
}`;

export const ShaderBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sync drawing buffer to CSS size
    const syncSize = () => {
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncSize);
      ro.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return;

    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uRes   = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        mouse.y = (1 - (e.clientY - rect.top) / rect.height) * canvas.height;
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    let raf: number;
    const render = (t: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime)  gl.uniform1f(uTime, t * 0.001);
      if (uRes)   gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      ro?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
};
