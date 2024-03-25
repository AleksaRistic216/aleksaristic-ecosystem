import { Grid, Typography } from "@mui/material"
import { BlogTable } from "./BlogTable"

export const BlogList = (): JSX.Element => {

    return (
        <Grid
            container
            justifyContent={`center`}
            py={15}
            maxWidth={`100vw`}>
            <Grid
                item
                sm={12}
                sx={{ textAlign: `center`, p: 2}}>
                    <Grid
                        spacing={2}
                        container
                        justifyContent={`center`}>
                            <Grid item sm={12}>
                                <Typography component={`h1`} variant={`h4`}>
                                    Welcome to Aleksa Ristić&apos;s blog!
                                </Typography>
                            </Grid>
                            <Grid item sm={12}>
                                <Grid container justifyContent={`center`}>
                                    <Grid item sm={4}>
                                        <Typography component={`h3`} variant={`body2`}>
                                            This is a place where I share my thoughts, experiences, and knowledge about software development, technology, and life in general.
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <BlogTable />
                    </Grid>
            </Grid>
        </Grid>
    )
}