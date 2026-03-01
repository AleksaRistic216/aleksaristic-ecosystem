import { PersonalBlogList } from "@/widgets/PersonalBlog"
import { Layout } from "@/widgets/Layout"
import { Grid } from "@mui/material"

const PersonalBlog = () => {
    return (
        <Layout>
            <Grid sx={{
                maxWidth: `100vw`,
                overflowY: `scroll`,
                flex: 1,
                minHeight: 0
            }}>
                <PersonalBlogList />
            </Grid>
        </Layout>
    )
}

export default PersonalBlog
