import { Canvas } from '@react-three/fiber'
import { Grid } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { ExploreButton } from './ExploreButton'
import { Title } from './Title'
import { Camera } from './Camera'
import { Desk } from './Desk'
import { Laptop } from './Laptop'
import { useRouter } from 'next/router'

export const IndexScene = (): JSX.Element => {

    const [isRedirecting, setIsRedirecting] = useState(false)
    const positionRef = useRef<string>(`center`)
    const hideTitleRef = useRef<any>(null)
    const router = useRouter()
    const redirectRef = useRef<any>({
        redirectNow: () => {
            setIsRedirecting(true)
            router.push("/explore")
        }
    })

    return isRedirecting ? <Grid></Grid> :
        <Grid>
            <Grid container
                justifyContent={`start`}
                direction={`column`}
                sx={{
                    zIndex: 1000,
                    position: `absolute`,
                    height: `100vh`,
                    width: `100vw`,
                    textAlign: `center`,
                    pt: 15,
                }}>
                    <Title innerRef={hideTitleRef} />
            </Grid>
            <Grid container
                justifyContent={`end`}
                direction={`column`}
                sx={{
                    zIndex: 1000,
                    position: `absolute`,
                    height: `100vh`,
                    width: `100vw`,
                }}>
                    <ExploreButton positionRef={positionRef} hideTitleRef={hideTitleRef} />
            </Grid>
            <Canvas
                style={{
                    width: `100vw`,
                    height: `100vh`
                }}>
                    <Camera positionRef={positionRef} redirectRef={redirectRef}/>
                    <ambientLight intensity={Math.PI * 1.7} />
                    <Laptop />
                    <Desk />
            </Canvas>
        </Grid>
}
