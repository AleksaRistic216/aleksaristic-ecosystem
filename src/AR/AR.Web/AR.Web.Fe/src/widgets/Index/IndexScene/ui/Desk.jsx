import { useLoader } from "@react-three/fiber"
import { GLTFLoader } from "three/examples/jsm/Addons.js"

export const Desk = () => {

    const scale = 0.5

    const glft = useLoader(GLTFLoader, '/models/desk/Table.gltf')
    glft.scene.scale.set(scale / 3, scale, scale)
    glft.scene.position.set(glft.scene.position.x, -1.28, glft.scene.position.z)
    glft.scene.rotation.set(0.3, 0, 0)

    return <primitive object={glft.scene} />
}