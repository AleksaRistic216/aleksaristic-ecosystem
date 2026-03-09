import { Box, Grid } from "@mui/material"
import { NavigationMenu } from "@/widgets/NavigationMenu"
import Head from "next/head"

export const MobileLayout = (props) => {
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            </Head>
            <Grid
                container
                direction={`column`}
                sx={{
                    height: `100dvh`,
                    width: `100vw`,
                    flexWrap: 'nowrap',
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                }}>
                    <NavigationMenu></NavigationMenu>
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {props.children}
                    </Box>
            </Grid>
        </>
    )
}
