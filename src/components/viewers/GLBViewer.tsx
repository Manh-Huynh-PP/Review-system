import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'

type GLBViewerProps = {
  url: string
  autoRotate?: boolean
  className?: string // Use Tailwind classes to control height, e.g. h-[400px]
}

function FitAndRender({ url, autoRotate = true }: { url: string; autoRotate?: boolean }) {
  const { scene: gltf } = useGLTF(url, true)
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()

  // Center and scale model to fit view
  useEffect(() => {
    if (!group.current) return
    const box = new THREE.Box3().setFromObject(group.current)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    // Re-center model at origin
    group.current.position.x -= center.x
    group.current.position.y -= center.y
    group.current.position.z -= center.z

    // Fit camera distance
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180)
    const distance = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.6
    camera.position.set(distance, distance * 0.6, distance)
    ;(camera as THREE.PerspectiveCamera).near = distance / 100
    ;(camera as THREE.PerspectiveCamera).far = distance * 100
    camera.updateProjectionMatrix()
  }, [camera])

  useFrame((_, delta) => {
    if (autoRotate && group.current) {
      group.current.rotation.y += delta * 0.3
    }
  })

  return (
    <group ref={group}>
      <primitive object={gltf} />
    </group>
  )
}

export function GLBViewer({ url, autoRotate = true, className }: GLBViewerProps) {
  return (
    <div className={className ?? 'h-[400px]'}>
      <Canvas shadows camera={{ position: [2, 1.2, 2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <Suspense
          fallback={
            <Html center>
              <div className="text-sm text-muted-foreground bg-background/80 px-3 py-2 rounded-md border">
                Đang tải mô hình 3D...
              </div>
            </Html>
          }
        >
          <FitAndRender url={url} autoRotate={autoRotate} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>
    </div>
  )
}

