import { useAuth } from '@/app/context/AuthContext'
import { Box, Button, Grid, Typography } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useState } from 'react'
import { AuthButton } from '@/widgets/Auth'
import { BlogTable } from './BlogTable'
import { BlogEditorModal } from '../../BlogEditor/ui/BlogEditorModal'

export const BlogList = (): JSX.Element => {
    const { isAdmin } = useAuth()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleSave = () => {
        setRefreshKey((prev) => prev + 1)
    }

    return (
        <Grid container justifyContent="center" py={15} maxWidth="100vw">
            <Grid item sm={12} sx={{ textAlign: 'center', p: 2 }}>
                <Grid spacing={2} container justifyContent="center">
                    <Grid
                        item
                        sm={12}
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
                    <Grid item sm={12}>
                        <Typography
                            component="h1"
                            variant="h4"
                            fontWeight={600}
                        >
                            Welcome to Aleksa Ristić&apos;s blog!
                        </Typography>
                    </Grid>
                    <Grid item sm={12}>
                        <Grid container justifyContent="center">
                            <Grid item sm={4}>
                                <Typography
                                    component="h3"
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    This is a place where I share my thoughts,
                                    experiences, and knowledge about software
                                    development, technology, and life in
                                    general.
                                </Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    {isAdmin && (
                        <Grid item sm={12} sx={{ mt: 1 }}>
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
                                New Blog Post
                            </Button>
                        </Grid>
                    )}
                    <BlogTable key={refreshKey} />
                </Grid>
            </Grid>

            <BlogEditorModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleSave}
                mode="create"
            />
        </Grid>
    )
}
