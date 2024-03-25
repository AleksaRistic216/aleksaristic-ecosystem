import { BlogList } from "@/widgets/Blog"
import { Layout } from "@/widgets/Layout"
import { Grid } from "@mui/material"

const Blog = (): JSX.Element => {
    return (
        <Layout>
            <Grid sx={{
                maxWidth: `100vw`,
                overflowY: `scroll`
            }}>
                <BlogList />
            </Grid>
        </Layout>
    )
}

export default Blog