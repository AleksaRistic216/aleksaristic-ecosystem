import { useAuth } from '@/app/context/AuthContext'
import { Box, Button, Grid, Typography } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useState } from 'react'
import { AuthButton } from '@/widgets/Auth'
import { InvestiranjeTable } from './InvestiranjeTable'
import { InvestiranjeEditorModal } from '../../InvestiranjeEditor/ui/InvestiranjeEditorModal'
import { PortfolioSection } from '../../Portfolio/ui/PortfolioSection'

export const InvestiranjeList = () => {
    const { isAdmin } = useAuth()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleSave = () => {
        setRefreshKey((prev) => prev + 1)
    }

    return (
        <Grid container justifyContent="center" py={{ xs: 4, sm: 15 }} maxWidth="100vw">
            <Grid item xs={12} sx={{ textAlign: 'center', p: 2 }}>
                <Grid spacing={2} container justifyContent="center">
                    <Grid
                        item
                        xs={12}
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            maxWidth: 800,
                            margin: '0 auto',
                            px: 2,
                        }}
                    >
                        <AuthButton />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography
                            component="h1"
                            variant="h4"
                            fontWeight={600}
                        >
                            Investiranje
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container justifyContent="center">
                            <Grid item xs={10} sm={4}>
                                <Typography
                                    component="h3"
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Članci i resursi o investiranju,
                                    finansijama i upravljanju portfoliom.
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <PortfolioSection />
                    <Grid item xs={12} sx={{ mt: 4 }}>
                        <Typography
                            component="h2"
                            variant="h5"
                            fontWeight={600}
                        >
                            Članci
                        </Typography>
                    </Grid>
                    {isAdmin && (
                        <Grid item xs={12} sx={{ mt: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => setIsCreateOpen(true)}
                                size="large"
                                sx={{
                                    textTransform: 'none',
                                    px: 3,
                                    py: 1.25,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    boxShadow: 2,
                                    '&:hover': {
                                        boxShadow: 4,
                                    },
                                }}
                            >
                                Novi članak
                            </Button>
                        </Grid>
                    )}
                    <InvestiranjeTable key={refreshKey} />
                </Grid>
            </Grid>

            <InvestiranjeEditorModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleSave}
                mode="create"
            />
        </Grid>
    )
}
