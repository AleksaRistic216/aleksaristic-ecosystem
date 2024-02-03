import { CookieNames } from '@/app/constants'
import { Button, Grid } from '@mui/material'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import useCookie from 'react-use-cookie'

export const ExploreButton = (props: any): JSX.Element => {
    const [firstTimeCookie, setFirstTimeCookie] = useCookie(CookieNames.firstTime, `true`)
    
    const [buttonY, setButtonY] = useState<number>(-10)
    const [opacity, setOpacity] = useState<number>(0)

    const delayMovement = 0.3
    const delayOpacity = 0.3

    useEffect(() => {
        setTimeout(() => {
            for(var i = 0; i < 1000; i++)
                setTimeout(() => {
                    setButtonY((prev) => prev + 0.02)
                }, i);
        }, 1000 * (delayMovement + 1));

        setTimeout(() => {
            for(var i = 0; i < 1000; i++)
                setTimeout(() => {
                    setOpacity((prev) => prev + 0.0015)
                }, i);
        }, 1500 * (delayOpacity + 1));
    }, [])

    return (
        <Grid
            item

            sx={{
                textAlign: `center`,
                width: `100%`,
                my: buttonY,
                opacity: opacity,
            }}>
            <Button
                variant={`contained`}
                sx={{
                    px: 10,
                    py: 3
                }}
                onClick={() => {
                    props.positionRef.current = `left`
                    setFirstTimeCookie(`false`)
                    props.hideTitleRef.current.hideTitle()

                    for(var i = 0; i < 1000; i++)
                        setTimeout(() => {
                            setOpacity((prev) => prev - 0.004)
                        }, i);
                }}>
                    Explore
            </Button>
        </Grid>
    )
}