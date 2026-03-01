import { useAuth } from '@/app/context/AuthContext'
import { Box, Button, Grid, Typography } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useState } from 'react'
import { AuthButton } from '@/widgets/Auth'
import { PersonalBlogTable } from './PersonalBlogTable'
import { PersonalBlogEditorModal } from '../../PersonalBlogEditor/ui/PersonalBlogEditorModal'

export const PersonalBlogList = () => {
    const { isAdmin } = useAuth()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleSave = () => {
        setRefreshKey((prev) => prev + 1)
    }

    return (
        <Grid container justifyContent="center" py={15} maxWidth="100vw">
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
                            Personal Blog
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Grid container justifyContent="center">
                            <Grid item xs={12} sm={4}>
                                <Typography
                                    component="h3"
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    A personal space for thoughts, reflections,
                                    and stories beyond the world of code.
                                </Typography>
                            </Grid>
                        </Grid>
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
                                New Post
                            </Button>
                        </Grid>
                    )}
                    <PersonalBlogTable key={refreshKey} />
                </Grid>
            </Grid>

            <PersonalBlogEditorModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleSave}
                mode="create"
            />
        </Grid>
    )
}
