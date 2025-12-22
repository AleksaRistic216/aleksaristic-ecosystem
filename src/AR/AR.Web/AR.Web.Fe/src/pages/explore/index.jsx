import { BottomIcons } from '@/widgets/Explore/BottomIcons'
import { InfoCard } from '@/widgets/Explore/InfoCard'
import { WelcomeMessage } from '@/widgets/Explore/WelcomeMessage'
import { Layout } from '@/widgets/Layout'
import { Grid, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

const Explore = () => {
    const [isWelcomeMessageVisible, setIsWelcomeMessageVisible] =
        useState(false)
    const [showOthers, setShowOthers] = useState(false)
    const [allowScroll, setAllowScroll] = useState(false)

    useEffect(() => {
        setTimeout(() => {
            showWelcomeMessage()
        }, 500)
    }, [])

    const showWelcomeMessage = () => {
        setIsWelcomeMessageVisible(true)
        setTimeout(() => {
            setShowOthers(true)

            setTimeout(() => {
                setAllowScroll(true)
            }, 500)
        }, 800)
    }

    return (
        <Layout>
            <Grid
                container
                px={2}
                justifyContent={`center`}
                style={{
                    overflowY: `scroll`,
                    height: `2100px !important`,
                    paddingBottom: `12vh`,
                }}
            >
                {isWelcomeMessageVisible ? (
                    <WelcomeMessage></WelcomeMessage>
                ) : null}
                {showOthers ? <InfoCard></InfoCard> : null}
                {showOthers ? (
                    <Grid
                        sx={{
                            my: 5,
                        }}
                    >
                        <Typography>
                            Browse my projects through the top menu and read
                            blog posts to learn more about me.
                        </Typography>
                    </Grid>
                ) : null}
            </Grid>
            {showOthers && allowScroll ? <BottomIcons></BottomIcons> : null}
        </Layout>
    )
}

export default Explore
