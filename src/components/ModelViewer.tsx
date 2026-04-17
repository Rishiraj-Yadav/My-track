/**
 * ModelViewer.tsx
 * Robust GLB viewer for the Expense Autopsy landing page.
 *
 * Key fixes vs. previous version:
 *  - Single WebGL context (no duplicate Canvas mounts)
 *  - useMemo for scene clone + material patch (no per-render cloning)
 *  - Standard Three.js JSX lights instead of drei volumetric SpotLight
 *  - powerPreference: 'default' (high-performance trips context loss on iGPUs)
 *  - dpr capped at 1 to spare GPU memory
 *  - Explicit canvas fill via position:absolute + inset:0
 */
import { Suspense, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/* ─────────────────────────────────────────
   Context-loss handler (re-logs only)
───────────────────────────────────────── */
function ContextWatcher() {
  const { gl } = useThree()
  useEffect(() => {
    const canvas = gl.domElement
    const onLoss = () => console.warn('[ModelViewer] WebGL context lost — will try to restore.')
    const onRestore = () => console.info('[ModelViewer] WebGL context restored.')
    canvas.addEventListener('webglcontextlost', onLoss)
    canvas.addEventListener('webglcontextrestored', onRestore)
    return () => {
      canvas.removeEventListener('webglcontextlost', onLoss)
      canvas.removeEventListener('webglcontextrestored', onRestore)
    }
  }, [gl])
  return null
}

/* ─────────────────────────────────────────
   Model — one clone per mount, materials
   patched once, glow updated each frame
───────────────────────────────────────── */
interface ModelProps {
  rotationSpeed: number
  glowIntensity: number
}

function Model({ rotationSpeed, glowIntensity }: ModelProps) {
  const group = useRef<THREE.Group>(null!)
  const { scene } = useGLTF('/model.glb')

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material)
        ? (mesh.material as THREE.MeshStandardMaterial[])
        : ([mesh.material] as THREE.MeshStandardMaterial[])

      const patched = mats.map((m) => {
        if (!(m instanceof THREE.MeshStandardMaterial)) return m
        const c = m.clone()
        c.emissive = new THREE.Color('#00FF88')
        c.emissiveIntensity = 0.08
        c.envMapIntensity = 1.8
        c.needsUpdate = true
        return c
      })
      // @ts-expect-error – assigning back correctly
      mesh.material = Array.isArray(mesh.material) ? patched : patched[0]
    })
    return clone
  }, [scene])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!group.current) return
    group.current.rotation.y += rotationSpeed * 0.016
    group.current.position.y = Math.sin(t * 0.6) * 0.12

    // Live glow update — cheap property assignment only
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const mats = Array.isArray(mesh.material)
        ? (mesh.material as THREE.MeshStandardMaterial[])
        : ([mesh.material] as THREE.MeshStandardMaterial[])
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.emissiveIntensity = glowIntensity
        }
      })
    })
  })

  return (
    <group ref={group}>
      <primitive object={cloned} scale={0.65} />
    </group>
  )
}

/* ─────────────────────────────────────────
   Lights — standard JSX primitives ONLY
   (drei SpotLight is volumetric mesh
    and can cause context exhaustion)
───────────────────────────────────────── */
function Lights({ intensity }: { intensity: number }) {
  return (
    <>
      <spotLight
        position={[0, 5, 4]}
        angle={0.38}
        penumbra={0.85}
        intensity={intensity * 80}
        color="#00FF88"
        distance={20}
        decay={2}
      />
      <spotLight
        position={[-4, 3, -3]}
        angle={0.5}
        penumbra={1}
        intensity={intensity * 38}
        color="#35f0d2"
        distance={16}
        decay={2}
      />
      <spotLight
        position={[4, 1, 3]}
        angle={0.6}
        penumbra={1}
        intensity={intensity * 26}
        color="#66b8ff"
        distance={16}
        decay={2}
      />
      <ambientLight intensity={0.20} />
    </>
  )
}

/* ─────────────────────────────────────────
   Scene — everything inside the Canvas
───────────────────────────────────────── */
interface SceneProps extends ModelProps {
  lightIntensity: number
}

function Scene({ rotationSpeed, glowIntensity, lightIntensity }: SceneProps) {
  return (
    <>
      <ContextWatcher />
      <Lights intensity={lightIntensity} />
      <Environment preset="city" />
      <Model rotationSpeed={rotationSpeed} glowIntensity={glowIntensity} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
        dampingFactor={0.08}
        enableDamping
      />
    </>
  )
}

/* ─────────────────────────────────────────
   Loading fallback
───────────────────────────────────────── */
function LoadingFallback() {
  return (
    <div className="model-loading">
      <div className="model-loading__spinner" />
      <span>Loading 3D model…</span>
    </div>
  )
}

/* ─────────────────────────────────────────
   Public component
───────────────────────────────────────── */
export interface ModelViewerProps {
  wealthFactor?: number
  className?: string
}

export function ModelViewer({ wealthFactor = 0, className = '' }: ModelViewerProps) {
  const rotationSpeed  = 0.003 + wealthFactor * 0.009  // 0.003 → 0.012
  const glowIntensity  = 0.08  + wealthFactor * 0.47   // 0.08  → 0.55
  const lightIntensity = 1.0   + wealthFactor * 0.6    // 1.0   → 1.6

  return (
    <div className={`model-viewer-wrap ${className}`.trim()}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 6.5], fov: 45 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
            preserveDrawingBuffer: false,
          }}
          onCreated={({ scene }) => { scene.background = null }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
          }}
          dpr={1}
          frameloop="always"
        >
          <Scene
            rotationSpeed={rotationSpeed}
            glowIntensity={glowIntensity}
            lightIntensity={lightIntensity}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}

useGLTF.preload('/model.glb')
