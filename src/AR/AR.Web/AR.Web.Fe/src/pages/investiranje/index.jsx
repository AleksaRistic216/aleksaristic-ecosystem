import { InvestiranjeList } from '@/widgets/Investiranje'
import { Layout } from '@/widgets/Layout'
import { Grid } from '@mui/material'

const Investiranje = () => {
    return (
        <Layout>
            <Grid
                sx={{
                    maxWidth: `100vw`,
                    overflowY: `scroll`,
                }}
            >
                <InvestiranjeList />
            </Grid>
        </Layout>
    )
}

export default Investiranje
