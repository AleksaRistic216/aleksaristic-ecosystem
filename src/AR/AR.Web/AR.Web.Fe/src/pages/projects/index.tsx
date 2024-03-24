import { Layout } from "@/widgets/Layout"
import { ProjectsList } from "@/widgets/Projects/ProjectsList"
import { Grid } from "@mui/material"

const Projects = (): JSX.Element => {
    return (
        <Layout>
            <Grid sx={{
                overflowY: `scroll`
            }}>
                <ProjectsList />
            </Grid>
        </Layout>
    )
}

export default Projects