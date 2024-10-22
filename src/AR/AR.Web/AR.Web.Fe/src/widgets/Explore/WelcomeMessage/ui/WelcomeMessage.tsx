import { Grid, Typography, styled } from '@mui/material'
import { useEffect, useState } from 'react'

export const WelcomeMessage = (): JSX.Element => {
    const [opacity, setOpacity] = useState<number>(0)

    useEffect(() => {
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                setOpacity(i / 100)
            }, i * 15)
        }
    }, [])

    const WelcomeMessageStyled = styled(Grid)(
        ({ theme }) => `
            top: 0;
            left: 0;
            width: 100vw;
            padding-top: 20vh;
            height: 80vh;
            opacity: ${opacity};
            justify-content: center;
            align-items: center;
        `
    )

    const borderWidth = `8px`
    const borderColor = `rgba(50, 50, 50, 1)`

    const backgroundColor = `rgba(255, 255, 255, 1)`

    return (
        <WelcomeMessageStyled container direction={`row`}>
            <Grid
                item
                sx={{
                    backgroundColor: backgroundColor,
                }}
            >
                <Typography
                    padding={`15px`}
                    borderBottom={`${borderWidth} solid ${borderColor}`}
                    borderRight={`${borderWidth} solid ${borderColor}`}
                    borderLeft={`${borderWidth} solid ${borderColor}`}
                    variant={`h3`}
                    position={`relative`}
                    textAlign={`center`}
                >
                    <Grid
                        sx={{
                            position: `absolute`,
                            top: `1px`,
                            left: `0`,
                            width: `calc(100% + ${borderWidth} + ${borderWidth})`,
                            marginLeft: `-${borderWidth}`,
                            borderLeft: `${borderWidth} solid ${borderColor}`,
                            borderRight: `${borderWidth} solid ${borderColor}`,
                            borderTop: `${borderWidth} solid ${borderColor}`,
                            paddingTop: `30vh`,
                            transform: `translateY(-100%)`,
                            backgroundColor: backgroundColor,
                        }}
                    >
                        <Typography
                            position={`absolute`}
                            top={`0`}
                            width={`100%`}
                            variant={`h6`}
                            textAlign={`center`}
                        >
                            mouse over notch to expose menu
                        </Typography>
                    </Grid>
                    Welcome to my personal space - Aleksa Ristić
                </Typography>
            </Grid>
        </WelcomeMessageStyled>
    )
}
