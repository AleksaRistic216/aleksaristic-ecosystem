import { Grid } from "@mui/material"
import { NavigationMenu } from "@/widgets/NavigationMenu"

export const Layout = (props) => {
    return (
        <Grid
            container
            direction={`column`}
            sx={{
                height: `100vh`,
                width: `100vw`
            }}>
                <NavigationMenu></NavigationMenu>
                {props.children}
        </Grid>
    )
}