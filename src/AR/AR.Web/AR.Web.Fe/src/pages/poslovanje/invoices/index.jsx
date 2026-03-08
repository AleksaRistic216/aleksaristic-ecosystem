import { Layout } from '@/widgets/Layout'
import { InvoiceList } from '@/widgets/Poslovanje'
import { useAuth } from '@/app/context/AuthContext'
import { AuthButton } from '@/widgets/Auth'
import { Grid, Typography } from '@mui/material'

const Invoices = () => {
    const { isAdmin, loading } = useAuth()

    if (loading) return null

    if (!isAdmin) {
        return (
            <Layout>
                <Grid
                    container
                    justifyContent="center"
                    alignItems="center"
                    sx={{ height: '80vh' }}
                >
                    <Grid item sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Please log in to access this section.
                        </Typography>
                        <AuthButton />
                    </Grid>
                </Grid>
            </Layout>
        )
    }

    return (
        <Layout>
            <InvoiceList />
        </Layout>
    )
}

export default Invoices
