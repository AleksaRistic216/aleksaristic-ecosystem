import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/Addons.js"

export const Laptop = () => {

    const scale = 2.5

    const glft = useLoader(GLTFLoader, '/models/laptop/AleksaLaptop.gltf')
    glft.scene.scale.set(1, scale, scale)
    glft.scene.rotation.set(0.4, 0, 0)
    glft.scene.position.set(glft.scene.position.x, 0, 0.6)

    const mixer = new THREE.AnimationMixer(glft.scene)
    glft.animations.forEach((clip) => {
        clip.duration /= 2
        let animation = mixer.clipAction(clip)
        animation.startAt(0.5)
        animation.setLoop(THREE.LoopOnce, 1)
        animation.clampWhenFinished = true
        animation.play()
    })

    useFrame((state, delta) => {
        mixer.update(delta)
    })

    return <primitive object={glft.scene} />
}