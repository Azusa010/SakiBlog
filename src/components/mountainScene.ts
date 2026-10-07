import type * as ThreeNS from 'three'

/**
 * 环境星尘与山脊微光场景(Three.js 增强层):
 * 替代此前过密过曝的实体粒子山, 改为 2000+ 颗稀疏优雅的夜空浮尘与山脊星芒。
 * 使用普通混合(NormalBlending)与低透明度, 杜绝高光过曝, 保留底层雪山照片的通透与层次。
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
  varying float vTwinkle;

  void main() {
    vec3 pos = position;

    // 微风轻拂: 沿水平方向缓慢漂移, 循环包裹保持在视口区间
    float drift = uTime * (0.6 + aSeed * 0.8);
    pos.x = mod(pos.x + drift + 60.0, 120.0) - 60.0;
    pos.y += sin(uTime * 0.35 + aSeed * 25.0) * 0.7;
    pos.z += cos(uTime * 0.3 + aSeed * 18.0) * 0.5;

    // 滚动散场: 随着页面向下滚, 星尘向右上空轻轻散开并淡出
    float takeoff = clamp(uDissolve * 1.5, 0.0, 1.0);
    pos.x += takeoff * (14.0 + aSeed * 12.0);
    pos.y += takeoff * takeoff * 18.0;

    // 鼠标推斥: 视口平面上的轻柔涟漪
    vec4 world = modelMatrix * vec4(pos, 1.0);
    float d = distance(world.xy, uMouse);
    float push = smoothstep(24.0, 0.0, d) * (1.0 - takeoff);
    pos.x += push * 5.0 * (0.5 + aSeed);
    pos.y += push * 3.5 * aSeed;

    vFade = 1.0 - takeoff * 0.9;
    vTwinkle = sin(uTime * 1.6 + aSeed * 50.0);

    vec4 mvPos = viewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // 精致微小的星尘光点, 保证粒度细微且不遮挡背景
    gl_PointSize = (0.9 + aSeed * 1.4) * (140.0 / -mvPos.z);
  }
`

const FRAGMENT = /* glsl */ `
  varying float vFade;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    // 柔和羽化边缘 + 细微呼吸闪烁, 控制在低不透明度
    float alpha = smoothstep(0.5, 0.06, d) * vFade * (0.32 + 0.22 * vTwinkle);
    if (alpha < 0.01) discard;

    // 柔和空灵的翡翠玉露星芒 (与高地苍翠对齐)
    vec3 emerald = mix(vec3(0.35, 0.76, 0.54), vec3(0.78, 0.96, 0.85), smoothstep(0.5, 0.0, d));
    gl_FragColor = vec4(emerald, alpha);
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

  // ---------- 粒子几何: 稀疏分布的环境星尘与山脊星芒 ----------
  const COUNT = 2200
  const positions = new Float32Array(COUNT * 3)
  const seeds = new Float32Array(COUNT)
  const heights = new Float32Array(COUNT)

  const ridge = (x: number, z: number): number => {
    const main = 16 * Math.exp(-((x - 4) ** 2) / 260) * (1 - Math.abs(z) / 60)
    const west = 9 * Math.exp(-((x + 16) ** 2) / 90) * (1 - Math.abs(z) / 70)
    const foothill = 3.5 * Math.exp(-((x + 6) ** 2) / 500)
    return Math.max(main + west + foothill - Math.abs(z) * 0.06, 0)
  }

  for (let i = 0; i < COUNT; i += 1) {
    const seed = Math.random()
    seeds[i] = seed

    if (seed < 0.65) {
      // 沿着山脊轮廓与上方空域轻柔浮游, 绝不填满山体实心
      const x = (Math.random() - 0.5) * 85
      const z = (Math.random() - 0.5) * 40
      const peak = ridge(x, z)
      // 漂浮在山脊上方高度区间
      const y = peak + (Math.random() - 0.15) * 10
      positions[i * 3] = x
      positions[i * 3 + 1] = Math.max(y, 1.0)
      positions[i * 3 + 2] = z - 6
      heights[i] = peak > 0.01 ? y / (peak + 0.001) : 0.5
    } else {
      // 广阔夜空背景里的微光尘埃
      const x = (Math.random() - 0.5) * 110
      const y = Math.random() * 26 + 2
      const z = (Math.random() - 0.5) * 50
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z - 10
      heights[i] = 1.0
    }
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

  // 关键: 使用 NormalBlending 避免数万粒子叠加引发的致盲性白光过曝
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as ThreeNS.ShaderMaterial['uniforms'],
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
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

  // 滚动散场: hero 滚出视口的过程中 0 → 1
  function dissolveFromScroll() {
    const rect = mount.getBoundingClientRect()
    const gone = Math.min(Math.max(-rect.top / window.innerHeight, 0), 1)
    uniforms.uDissolve.value = gone
    uniforms.uScroll.value = window.scrollY
  }
  window.addEventListener('scroll', dissolveFromScroll, { passive: true })

  // ---------- 帧循环 ----------
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
