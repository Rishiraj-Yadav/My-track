import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface ModelViewerProps {
  wealthFactor?: number
  className?: string
}

function ContextWatcher() {
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const onLoss = () => console.warn('[ModelViewer] WebGL context lost.')
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

function Model({
  rotationSpeed,
  glowIntensity,
}: {
  rotationSpeed: number
  glowIntensity: number
}) {
  const group = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/model.glb')

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      obj.material = materials.map((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return material
        const patched = material.clone()
        patched.emissive = new THREE.Color('#00FF88')
        patched.emissiveIntensity = 0.08
        patched.envMapIntensity = 1.8
        return patched
      })
    })

    clone.updateWorldMatrix(true, true)
    const bounds = new THREE.Box3().setFromObject(clone)
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const scale = 2.8 / maxDim

    clone.position.sub(center)
    clone.scale.setScalar(scale)
    return clone
  }, [scene])

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime()
    if (group.current) {
      group.current.rotation.y += rotationSpeed * 0.016
      group.current.position.y = Math.sin(elapsed * 0.6) * 0.12
    }

    cloned.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.emissiveIntensity = glowIntensity
        }
      })
    })
  })

  return (
    <group ref={group}>
      <primitive object={cloned} />
    </group>
  )
}

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
      <ambientLight intensity={0.2} />
      <hemisphereLight intensity={0.45} color="#ffffff" groundColor="#102033" />
      <directionalLight position={[0, 6, 8]} intensity={1.2} color="#ffffff" />
    </>
  )
}

function Scene({
  rotationSpeed,
  glowIntensity,
  lightIntensity,
}: {
  rotationSpeed: number
  glowIntensity: number
  lightIntensity: number
}) {
  return (
    <>
      <ContextWatcher />
      <Lights intensity={lightIntensity} />
      <Model rotationSpeed={rotationSpeed} glowIntensity={glowIntensity} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
        dampingFactor={0.08}
        enableDamping
        target={[0, 0, 0]}
      />
    </>
  )
}

function LoadingFallback() {
  return (
    <div className="model-loading">
      <div className="model-loading__spinner" />
      <span>Loading 3D model...</span>
    </div>
  )
}

export function ModelViewer({ wealthFactor = 0, className = '' }: ModelViewerProps) {
  const rotationSpeed = 0.003 + wealthFactor * 0.009
  const glowIntensity = 0.08 + wealthFactor * 0.47
  const lightIntensity = 1 + wealthFactor * 0.6

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
          onCreated={({ scene }) => {
            scene.background = null
          }}
          style={{
            position: 'absolute',
            inset: 0,
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
