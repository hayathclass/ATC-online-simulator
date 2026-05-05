'use client'

import { useEffect, useRef, useState } from 'react'

export default function ParticleSwarm() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation immediately on mount
    setIsVisible(true)
    
    if (!containerRef.current) return

    // Dynamic import for Three.js (client-side only)
    let animationId: number
    let cleanup = false

    const initThree = async () => {
      // Start loading Three.js immediately
      const THREE = await import('three')

      if (cleanup || !containerRef.current) return

      const container = containerRef.current

      // CONFIG
      const COUNT = 20000
      const SPEED_MULT = 0.3
      const AUTO_SPIN = true
      const SCALE_MULT = 1.0

      // SETUP
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x000000, 0.01)
      
      const width = container.clientWidth
      const height = container.clientHeight
      
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
      camera.position.set(0, 0, 220)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        powerPreference: "high-performance",
        alpha: true 
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 1)
      container.appendChild(renderer.domElement)
      
      console.log('Three.js renderer initialized:', width, 'x', height)

      // SWARM OBJECTS
      const dummy = new THREE.Object3D()
      const color = new THREE.Color()
      const target = new THREE.Vector3()

      // INSTANCED MESH
      const geometry = new THREE.TetrahedronGeometry(0.5)
      const material = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })

      const instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT)
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      scene.add(instancedMesh)

      // DATA ARRAYS
      const positions: any[] = []
      for (let i = 0; i < COUNT; i++) {
        positions.push(
          new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
          )
        )
        instancedMesh.setColorAt(i, color.setHex(0x00ff88))
      }

      // CONTROL STUBS
      const PARAMS = {
        "scale": 16,
        "tubeR": 4.5,
        "mainR": 9,
        "twist": 0.7,
        "flow": 0.6,
        "colorRate": 0.9
      }

      const addControl = (id: string, label: string, min: number, max: number, val: number) => {
        return PARAMS[id as keyof typeof PARAMS] !== undefined ? PARAMS[id as keyof typeof PARAMS] : val
      }

      // ANIMATION LOOP
      const clock = new THREE.Clock()
      let fadeInProgress = 0
      const fadeInSpeed = 0.05 // Faster fade-in (was 0.02)

      function animate() {
        if (cleanup) return
        
        animationId = requestAnimationFrame(animate)
        const delta = clock.getDelta()
        const time = clock.getElapsedTime() * SPEED_MULT

        // Fade in particles
        if (fadeInProgress < 1) {
          fadeInProgress = Math.min(fadeInProgress + fadeInSpeed, 1)
          material.opacity = fadeInProgress * 0.5
        }

        // SWARM LOGIC
        const count = COUNT
        for (let i = 0; i < COUNT; i++) {
          const scale = addControl("scale", "Overall Scale", 5, 30, 16) * SCALE_MULT
          const tubeR = addControl("tubeR", "Tube Radius", 2, 8, 4.5)
          const mainR = addControl("mainR", "Main Radius", 3, 15, 9)
          const twistAmount = addControl("twist", "Twist", 0, 2, 0.7)
          const flowSpeed = addControl("flow", "Flow Speed", 0, 1.5, 0.6)
          const colorRate = addControl("colorRate", "Color Cycle", 0, 2, 0.9)

          const countU = Math.floor(Math.sqrt(count * 1.2))
          const countV = Math.ceil(count / countU)
          const uStep = (Math.PI * 2) / countU
          const vStep = (Math.PI * 2) / countV

          const idxU = i % countU
          const idxV = Math.floor(i / countU) % countV
          const u = idxU * uStep
          const v = idxV * vStep

          const cosHalfV = Math.cos(v * 0.5)
          const sinHalfV = Math.sin(v * 0.5)
          const cosU = Math.cos(u)
          const sinU = Math.sin(u)
          const cos2U = Math.cos(2 * u)
          const sin2U = Math.sin(2 * u)

          const r = mainR + tubeR * cosHalfV * sinU - tubeR * sinHalfV * sin2U
          const x0 = (mainR + tubeR * cosHalfV * sinU) * cosU
          const y0 = (mainR + tubeR * cosHalfV * sinU) * sinU
          const z0 = tubeR * sinHalfV * cosU

          const timeTwist = time * flowSpeed
          const angleTwist = u * twistAmount + timeTwist
          const cosTwist = Math.cos(angleTwist)
          const sinTwist = Math.sin(angleTwist)

          const x1 = x0 * cosTwist - z0 * sinTwist
          const z1 = x0 * sinTwist + z0 * cosTwist
          const y1 = y0

          target.set(x1 * scale, y1 * scale, z1 * scale)

          const hue = ((u / (Math.PI * 2) + v / (Math.PI * 2) * 0.5 + time * 0.04 * colorRate) % 1.0)
          const sat = 0.8
          const light = 0.5
          color.setHSL(hue, sat, light)

          // LERP & UPDATE
          positions[i].lerp(target, 0.05)
          dummy.position.copy(positions[i])
          dummy.updateMatrix()
          instancedMesh.setMatrixAt(i, dummy.matrix)
          instancedMesh.setColorAt(i, color)
        }
        
        instancedMesh.instanceMatrix.needsUpdate = true
        if (instancedMesh.instanceColor) {
          instancedMesh.instanceColor.needsUpdate = true
        }

        // Auto rotation
        if (AUTO_SPIN) {
          const rotSpeed = 0.001 * SPEED_MULT
          scene.rotation.y += rotSpeed
        }

        renderer.render(scene, camera)
      }

      animate()
      
      console.log('Animation loop started')

      // Handle resize
      const handleResize = () => {
        if (!container) return
        const newWidth = container.clientWidth
        const newHeight = container.clientHeight
        camera.aspect = newWidth / newHeight
        camera.updateProjectionMatrix()
        renderer.setSize(newWidth, newHeight)
      }

      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => {
        console.log('Cleaning up Three.js scene')
        cleanup = true
        window.removeEventListener('resize', handleResize)
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement)
        }
        renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }

    const cleanupPromise = initThree()

    return () => {
      cleanupPromise.then(cleanup => {
        if (typeof cleanup === 'function') {
          cleanup()
        }
      })
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 transition-opacity duration-500 ease-out"
      style={{ 
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0,
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
      }}
    />
  )
}
