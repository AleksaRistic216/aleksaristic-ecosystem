import { Grid } from "@mui/material"
import { ILayoutProps } from "../models/ILayoutProps"
import { NavigationMenu } from "@/widgets/NavigationMenu"

export const Layout = (props: ILayoutProps): JSX.Element => {
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