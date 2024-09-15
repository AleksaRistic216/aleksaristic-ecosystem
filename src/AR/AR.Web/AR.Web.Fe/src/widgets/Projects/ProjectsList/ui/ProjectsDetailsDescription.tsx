import { Grid, Typography } from '@mui/material'
import { IProjectsDetailsDescriptionProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsDescriptionProps'

export const ProjectsDetailsDescription = (
    props: IProjectsDetailsDescriptionProps
) => {
    return (
        <Grid
            container
            sx={{
                py: 4,
            }}
            gap={2}
        >
            <Grid item xs={12}>
                <Typography variant={`h5`}>Description</Typography>
            </Grid>
            <Grid item xs={12}>
                <Typography>{props.description}</Typography>
            </Grid>
        </Grid>
    )
}
