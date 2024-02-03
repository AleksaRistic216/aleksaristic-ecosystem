import { BottomIcons } from "@/widgets/Explore/BottomIcons"
import { InfoCard } from "@/widgets/Explore/InfoCard"
import { ScrollDownHelper } from "@/widgets/Explore/ScrollDownHelper"
import { WelcomeMessage } from "@/widgets/Explore/WelcomeMessage"
import { Layout } from "@/widgets/Layout"
import { Grid } from "@mui/material"
import { useEffect, useState } from "react"

const Explore = (): JSX.Element => {

    const [isWelcomeMessageVisible, setIsWelcomeMessageVisible] = useState<boolean>(false)
    const [showOthers, setShowOthers] = useState<boolean>(false)
    const [allowScroll, setAllowScroll] = useState<boolean>(false)

    useEffect(() => {
        setTimeout(() => {
            showWelcomeMessage()
        }, 500);
    }, [])

    const showWelcomeMessage = () => {
        setIsWelcomeMessageVisible(true)
        setTimeout(() => {
            setShowOthers(true)

            setTimeout(() => {
                setAllowScroll(true)
            }, 500);
        }, 800);
    }

    return (
        <Layout>
            <Grid
                container
                justifyContent={`center`}
                style={{
                    overflowY:  `scroll`,
                    height: `2100px !important`,
                    paddingBottom: `12vh`
                }}>
                { isWelcomeMessageVisible ? <WelcomeMessage></WelcomeMessage> : null }
                { showOthers ? <InfoCard></InfoCard> : null }
            </Grid>
            { showOthers && allowScroll ? <BottomIcons></BottomIcons> : null }
        </Layout>
    )
}

export default Explore