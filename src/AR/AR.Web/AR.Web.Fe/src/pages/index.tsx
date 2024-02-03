import { CookieNames } from "@/app/constants"
import { IndexScene } from "@/widgets/Index/IndexScene/ui/IndexScene"
import { Grid } from "@mui/material"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import useCookie from 'react-use-cookie'

const Index = (): JSX.Element => {

    const router = useRouter()
    const [firstTimeCookie, setFirstTimeCookie] = useCookie(CookieNames.firstTime, `true`)
    const [show, setShow] = useState<boolean | undefined>(undefined)

    useEffect(() => {
        if(show == undefined)
            return

        // if(show == false)
        //     router.push(`/explore`)

    }, [router, show])

    useEffect(() => {
        setShow(firstTimeCookie == `true`)
    }, [router, firstTimeCookie, setFirstTimeCookie])

    return (
        <Grid container>
            <IndexScene />
        </Grid>
    )
}

export default Index