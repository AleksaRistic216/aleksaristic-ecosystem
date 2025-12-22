import { KeyboardArrowDown } from "@mui/icons-material"
import { Grid, Typography } from "@mui/material"

export const ScrollDownHelper = () => {
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