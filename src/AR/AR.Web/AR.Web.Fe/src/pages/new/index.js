import * as THREE from 'three'
import { useEffect, useState } from 'react'
import {
    FontLoader,
    GLTFLoader,
    TextGeometry,
} from 'three/examples/jsm/Addons.js'
import { useRouter } from 'next/router'

const NewPage = () => {
    const router = useRouter()
    const [userInput, setUserInput] = useState('')
    const [font, setFont] = useState(null)
    const [scene, setScene] = useState(new THREE.Scene())

    var dynamicTextGeometry
    var dynamicText

    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
    })

    const validCharacters =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'

    const textZ = 0.18

    const slowDownText = "Slow down li'l boy!"
    const invalidOptionText = 'Error: Invalid option'

    const [pcLoaded, setPcLoaded] = useState(false)

    const [triggerOption, setTriggerOption] = useState(false)

    useEffect(() => {
        if (!triggerOption) return

        switch (userInput) {
            case '1':
                router.push('/')
                break
            case '2':
                router.push('/projects')
                break
            case '3':
                router.push('/blog')
                break
            default:
                setTriggerOption(false)
                setUserInput(invalidOptionText)
                break
        }
    }, [triggerOption])

    useEffect(() => {
        if (font === null || scene === null || !pcLoaded) return

        const fontSize = 0.06
        const lineDistance = 0.04
        const textOptions = {
            font: font,
            size: fontSize,
            height: 0.005,
        }

        let currentY = 2.15

        const renderStaticText = (text) => {
            const staticText = new TextGeometry(text, textOptions)
            const staticTextMesh = new THREE.Mesh(staticText, textMaterial)
            staticTextMesh.position.z = textZ
            staticTextMesh.position.y = currentY
            currentY -= fontSize + lineDistance
            staticTextMesh.position.x = -0.75
            scene.add(staticTextMesh)
        }

        renderStaticText('Welcome to aleksaristic.com')
        renderStaticText('')
        renderStaticText('Select option and press enter')
        renderStaticText('1 - Home page')
        renderStaticText('2 - Projects')
        renderStaticText('3 - Blog')
        renderStaticText('')

        scene.remove(scene.getObjectByName('pc_text'))

        dynamicTextGeometry = new TextGeometry(
            'guest ~ $: ' + (userInput.length === 0 ? '█' : userInput),
            textOptions
        )
        dynamicText = new THREE.Mesh(dynamicTextGeometry, textMaterial)
        dynamicText.position.z = textZ
        dynamicText.position.y = currentY
        currentY -= fontSize + lineDistance
        dynamicText.position.x = -0.75
        dynamicText.name = 'pc_text'
        scene.add(dynamicText)
    }, [font, scene, userInput, pcLoaded])

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                setUserInput((prev) =>
                    prev.indexOf(slowDownText) >= 0 ||
                    prev.indexOf(invalidOptionText) >= 0
                        ? ''
                        : prev.slice(0, -1)
                )
                return
            }

            if (e.key === 'Enter') {
                setTriggerOption(true)
                return
            }

            if (!validCharacters.includes(e.key) && e.key !== ' ') return
            setUserInput((prev) =>
                prev.indexOf(slowDownText) >= 0 || prev.length > 10
                    ? slowDownText
                    : prev + e.key
            )
        })

        const mouse = new THREE.Vector2()
        document.addEventListener('mousemove', onDocumentMouseMove, false)
        function onDocumentMouseMove(event) {
            event.preventDefault()
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
        }

        let scroll = 0
        document.addEventListener('wheel', (e) => {
            scroll += e.deltaY

            const minScroll = -1000
            const maxScroll = 1000
            if (scroll < minScroll) {
                scroll = minScroll
            }

            if (scroll > maxScroll) {
                scroll = maxScroll
            }
        })

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        )
        const renderer = new THREE.WebGLRenderer()
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.domElement.style.cursor = 'none'
        document.body.appendChild(renderer.domElement)

        // ====

        const light = new THREE.DirectionalLight(0xffffff, 1)
        light.position.z = 10
        light.position.y = 10
        scene.add(light)

        const fontLoader = new FontLoader()
        fontLoader.load('fonts/helvetiker_regular.typeface.json', (f) => {
            setFont(f)
        })

        const gltfLoader = new GLTFLoader()
        gltfLoader.load('models/pc.glb', (gltf) => {
            const pcScene = gltf.scene
            const pcScale = 0.02
            pcScene.scale.set(pcScale, pcScale, pcScale)
            scene.add(pcScene)
            setPcLoaded(true)
        })
        // ====

        camera.position.y = 2
        camera.rotation.x = -0.3
        camera.position.z = 3.5

        const cameraRotationSpeed = 0.1
        const cameraRotationRange = 5

        function animate() {
            camera.rotation.y = THREE.MathUtils.lerp(
                camera.rotation.y,
                ((-mouse.x * Math.PI) / 100) * cameraRotationRange,
                cameraRotationSpeed
            )
            camera.rotation.x = THREE.MathUtils.lerp(
                camera.rotation.x,
                ((mouse.y * Math.PI) / 100) * cameraRotationRange - 0.3,
                cameraRotationSpeed
            )
            camera.position.setZ(
                THREE.MathUtils.lerp(
                    camera.position.z,
                    3.5 + scroll / 500,
                    0.05
                )
            )
            renderer.render(scene, camera)
        }
        renderer.setAnimationLoop(animate)
    }, [])
    return <></>
}

export default NewPage
