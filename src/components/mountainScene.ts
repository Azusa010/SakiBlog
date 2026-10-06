import type * as ThreeNS from 'three'

/**
 * 粒子山脉场景:所有动效在 GPU 上完成(顶点着色器),
 * CPU 每帧只更新 uniform(时间/滚动/鼠标),6 万粒子不掉帧。
 */

type THREE = typeof ThreeNS

interface Uniforms {
  uTime: { value: number }
  uScroll: { value: number }
  uMouse: { value: ThreeNS.Vector2 }
  uDissolve: { value: number }
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2 uMouse;
  uniform float uDissolve;
  attribute float aSeed;
  attribute float aHeight;

  varying float vFade;

  void main() {
    vec3 pos = position;

    // 山体轮廓:y 越低越接近"雾线",越容易被风带走
    float fragility = 1.0 - clamp(aHeight, 0.0, 1.0);
    float takeoff = clamp(uDissolve * 1.6 - fragility * 0.6, 0.0, 1.0);

    // 风:随时间增强的水平漂移 + 缓慢的正弦起伏
    float drift = takeoff * (14.0 + aSeed * 10.0);
    pos.x += drift * (0.6 + 0.4 * sin(uTime * 0.25 + aSeed * 40.0));
    pos.y += drift * 0.55 * sin(uTime * 0.35 + aSeed * 17.0) - takeoff * takeoff * 22.0;
    pos.z += drift * 0.3 * cos(uTime * 0.3 + aSeed * 23.0);

    // 鼠标推斥:视口平面上的涟漪,距离越近推得越开
    vec4 world = modelMatrix * vec4(pos, 1.0);
    float d = distance(world.xy, uMouse);
    float push = smoothstep(26.0, 0.0, d) * (1.0 - takeoff);
    pos.x += push * 6.0 * (0.5 + aSeed);
    pos.y += push * 4.0 * aSeed;

    vFade = 1.0 - takeoff * 0.85;
    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1.4 + aSeed * 1.8) * (300.0 / -(viewMatrix * vec4(pos, 1.0)).z);
  }
`

const FRAGMENT = /* glsl */ `
  varying float vFade;

  void main() {
    // 圆形粒子 + 中心亮缘,暖金色调
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.12, d) * vFade;
    if (alpha < 0.02) discard;
    vec3 warm = mix(vec3(0.55, 0.42, 0.26), vec3(1.0, 0.92, 0.78), smoothstep(0.5, 0.0, d));
    gl_FragColor = vec4(warm, alpha * 0.85);
  }
`

export function createMountain(THREE: THREE, mount: HTMLElement): () => void {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
  camera.position.set(0, 9, 58)

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)
  mount.appendChild(renderer.domElement)

  // ---------- 粒子几何:山脊函数采样 ----------
  const COUNT = 60000
  const positions = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT)
  const heights = new Float32Array(COUNT)

  const ridge = (x: number, z: number): number => {
    // 三层山脊叠加:远山缓、近山陡,主峰居中偏右(与照片呼应)
    const main = 16 * Math.exp(-((x - 4) ** 2) / 260) * (1 - Math.abs(z) / 60)
    const west = 9 * Math.exp(-((x + 16) ** 2) / 90) * (1 - Math.abs(z) / 70)
    const foothill = 3.5 * Math.exp(-((x + 6) ** 2) / 500)
    return Math.max(main + west + foothill - Math.abs(z) * 0.06, 0)
  }

  for (let i = 0; i < COUNT; i += 1) {
    // 体分布:x/z 平面上取点,y 按山脊高度的概率密度下沉
    const x = (Math.random() - 0.5) * 90
    const z = (Math.random() - 0.5) * 70
    const peak = ridge(x, z)
    const y = peak * Math.pow(Math.random(), 0.65)
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z - 8
    seeds[i] = Math.random()
    heights[i] = peak > 0.01 ? y / (peak + 0.001) : 0
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1))

  const uniforms: Uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uMouse: { value: new THREE.Vector2(999, 999) },
    uDissolve: { value: 0 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as ThreeNS.ShaderMaterial['uniforms'],
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const points = new THREE.Points(geometry, material)
  scene.add(points)

  // ---------- 尺寸 ----------
  function resize() {
    const rect = mount.getBoundingClientRect()
    const width = rect.width || 1
    const height = rect.height || 1
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(mount)

  // ---------- 交互 ----------
  // 鼠标 → 相机投影平面的世界坐标(近似:把视口点反投影到 z=0 平面)
  const mouseNDC = new THREE.Vector2(999, 999)
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const ray = new THREE.Raycaster()
  const hit = new THREE.Vector3()

  function updateMouseWorld(clientX: number, clientY: number) {
    const rect = mount.getBoundingClientRect()
    mouseNDC.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    ray.setFromCamera(mouseNDC, camera)
    if (ray.ray.intersectPlane(plane, hit)) {
      uniforms.uMouse.value.copy(hit)
    }
  }

  const onPointerMove = (event: PointerEvent) => updateMouseWorld(event.clientX, event.clientY)
  const onPointerLeave = () => {
    uniforms.uMouse.value.set(9999, 9999)
  }
  mount.addEventListener('pointermove', onPointerMove, { passive: true })
  mount.addEventListener('pointerleave', onPointerLeave)

  // 滚动散场:hero 滚出视口的过程中 0 → 1(与滚动退场叙事一致)
  function dissolveFromScroll() {
    const rect = mount.getBoundingClientRect()
    const gone = Math.min(Math.max(-rect.top / window.innerHeight, 0), 1)
    uniforms.uDissolve.value = gone
    uniforms.uScroll.value = window.scrollY
  }
  window.addEventListener('scroll', dissolveFromScroll, { passive: true })

  // ---------- 帧循环(仅 hero 在视口内时渲染) ----------
  let rafId = 0
  let running = true
  const clock = new THREE.Clock()

  function frame() {
    if (!running) return
    rafId = requestAnimationFrame(frame)
    const rect = mount.getBoundingClientRect()
    if (rect.bottom < 0 || rect.top > window.innerHeight) return
    uniforms.uTime.value = clock.getElapsedTime()
    renderer.render(scene, camera)
  }
  rafId = requestAnimationFrame(frame)

  return () => {
    running = false
    cancelAnimationFrame(rafId)
    resizeObserver.disconnect()
    window.removeEventListener('scroll', dissolveFromScroll)
    mount.removeEventListener('pointermove', onPointerMove)
    mount.removeEventListener('pointerleave', onPointerLeave)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}
