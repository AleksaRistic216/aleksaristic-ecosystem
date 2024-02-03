import { useEffect, useRef } from "react"
import { ICameraProps } from "../models/ICameraProps"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from 'three'
import { useRouter } from "next/router"

export const Camera = (props: ICameraProps) => {

    const router = useRouter()
    const cameraRef = useRef<any>()

    const set = useThree((state) => state.set)
    
    useEffect(() => {
        set({ camera: cameraRef.current })
    })

    useFrame(() => {
        const speed = 2

        const leftPosition = [0, 0.5, 0]
        const leftRotation = [-0.8, 0, 0]

        let rotation = cameraRef.current.rotation.toArray()
        let position = cameraRef.current.position.toArray()

        if(props.positionRef.current === `left` &&
            rotation[0] > leftRotation[0])
        {
            rotation[0] -= 0.0008 * speed
        }

        if(props.positionRef.current === `left` &&
            position[1] < leftPosition[1])
        {
            position[1] += 0.0015 * speed
        }

        if(props.positionRef.current === `left` &&
            position[2] > leftPosition[2])
        {
            position[2] -= 0.02 * speed
        }

        if(position[1] >= 0.5)
            props.redirectRef.current.redirectNow()

        cameraRef.current.setRotationFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]))
        cameraRef.current.position.set(position[0], position[1], position[2])
        cameraRef.current.updateMatrixWorld()
    })

    return <perspectiveCamera ref={cameraRef} fov={10} near={0.1} far={1000} position={[0, 0, 7]} rotation={[0, 0, 0]} />
}