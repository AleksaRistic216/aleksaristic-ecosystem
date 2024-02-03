import { KeyboardArrowDown } from "@mui/icons-material"
import { Grid, Typography } from "@mui/material"

export const ScrollDownHelper = (): JSX.Element => {
    return (
        <Grid
            textAlign={`center`}
            marginBottom={4}>
                <Typography>
                    scroll down
                </Typography>
                <KeyboardArrowDown />
        </Grid>
    )
}