import { Layout } from '@/widgets/Layout'
import { useAuth } from '@/app/context/AuthContext'
import { AuthButton } from '@/widgets/Auth'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { Receipt, Settings, Mail } from '@mui/icons-material'
import { useRouter } from 'next/router'

const Poslovanje = () => {
    const { isAdmin, loading } = useAuth()
    const router = useRouter()

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
            <Grid container justifyContent="center" py={6} px={2}>
                <Grid item xs={12} md={8} lg={6}>
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
                        Poslovanje
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Card
                                variant="outlined"
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 2 },
                                }}
                                onClick={() =>
                                    router.push('/poslovanje/invoices')
                                }
                            >
                                <CardContent
                                    sx={{ textAlign: 'center', py: 4 }}
                                >
                                    <Receipt sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="h6">
                                        Invoices
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Manage and print invoices
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Card
                                variant="outlined"
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 2 },
                                }}
                                onClick={() =>
                                    router.push('/poslovanje/envelope')
                                }
                            >
                                <CardContent
                                    sx={{ textAlign: 'center', py: 4 }}
                                >
                                    <Mail sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="h6">
                                        Envelope
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Send documents to bookkeeper
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Card
                                variant="outlined"
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': { boxShadow: 2 },
                                }}
                                onClick={() =>
                                    router.push('/poslovanje/settings')
                                }
                            >
                                <CardContent
                                    sx={{ textAlign: 'center', py: 4 }}
                                >
                                    <Settings sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography variant="h6">
                                        Settings
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Receivers, templates, provider info
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Layout>
    )
}

export default Poslovanje
