import NextIcon from '../assets/next-js-icon.png'
import NetIcon from '../assets/net-icon.png'
import AzureIcon from '../assets/azure-icon.png'
import AwsIcon from '../assets/aws-icon.png'
import FlutterIcon from '../assets/flutter-icon.png'
import ExpressIcon from '../assets/express-icon.png'
import FirebaseIcon from '../assets/firebase-icon.png'
import K8s from '../assets/k8sIcon.png'
import { Avatar, Grid, Typography, styled } from '@mui/material'
import { useEffect, useState } from 'react'

export const BottomIcons = (): JSX.Element => {
    const [opacity, setOpacity] = useState<number>(0)

    useEffect(() => {
        const iterations = 50
        for (let i = 0; i < iterations; i++) {
            setTimeout(() => {
                setOpacity(i / iterations)
            }, 8 * i)
        }
    }, [])

    const IconStyled = styled(Grid)(
        ({ theme }) => `
            padding: 10px 15px;
            opacity: ${opacity};
            background-color: rgba(255, 255, 255, 0.8);
        `
    )

    return (
        <Grid
            container
            direction={`row`}
            justifyContent={`center`}
            alignContent={`end`}
            position={`fixed`}
            style={{
                opacity: opacity,
            }}
            bottom={0}
        >
            <Grid item sm={12}>
                <Grid
                    container
                    direction={`row`}
                    justifyContent={`center`}
                    alignContent={`end`}
                >
                    <IconStyled item>
                        <Avatar src={NetIcon.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={AwsIcon.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={NextIcon.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={AzureIcon.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={ExpressIcon.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={FlutterIcon.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={K8s.src} />
                    </IconStyled>
                    <IconStyled item>
                        <Avatar src={FirebaseIcon.src} />
                    </IconStyled>
                </Grid>
            </Grid>
            {/*<Grid*/}
            {/*    item*/}
            {/*    sm={12}>*/}
            {/*        <Typography*/}
            {/*            textAlign={`center`}*/}
            {/*            color={`textPrimary`}*/}
            {/*            variant={`subtitle1`}>*/}
            {/*            tech stack*/}
            {/*        </Typography>*/}
            {/*</Grid>*/}
        </Grid>
    )
}
