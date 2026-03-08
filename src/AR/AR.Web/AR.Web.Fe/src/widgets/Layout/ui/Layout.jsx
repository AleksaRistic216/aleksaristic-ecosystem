import { Box, Grid } from "@mui/material"
import { NavigationMenu } from "@/widgets/NavigationMenu"

export const Layout = (props) => {
    return (
        <Grid
            container
            direction={`column`}
            sx={{
                height: `100vh`,
                width: `100vw`,
                flexWrap: 'nowrap',
            }}>
                <NavigationMenu></NavigationMenu>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {props.children}
                </Box>
        </Grid>
    )
}