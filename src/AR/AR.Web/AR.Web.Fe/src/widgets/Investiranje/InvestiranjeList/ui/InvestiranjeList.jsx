import { useAuth } from '@/app/context/AuthContext'
import { firebaseApp } from '@/app/firebase'
import { Box, Button, Grid, Typography } from '@mui/material'
import { Add } from '@mui/icons-material'
import { useState, useEffect, useCallback } from 'react'
import { get, getDatabase, query, ref } from 'firebase/database'
import { AuthButton } from '@/widgets/Auth'
import { InvestiranjeTable } from './InvestiranjeTable'
import { InvestiranjeEditorModal } from '../../InvestiranjeEditor/ui/InvestiranjeEditorModal'
import { PortfolioSection } from '../../Portfolio/ui/PortfolioSection'

export const InvestiranjeList = () => {
    const { isAdmin } = useAuth()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [posts, setPosts] = useState(undefined)

    const fetchPosts = useCallback(() => {
        const db = getDatabase(firebaseApp)
        const q = query(ref(db, '/investiranje'))

        get(q)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const postsWithKeys = Object.keys(data)
                        .filter((key) => data[key] != null)
                        .map((key) => ({
                            key,
                            data: data[key],
                        }))
                    setPosts(postsWithKeys)
                } else {
                    setPosts([])
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }, [])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    const handleSave = () => {
        fetchPosts()
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
                    <InvestiranjeTable
                        posts={posts}
                        onRefresh={fetchPosts}
                    />
                </Grid>
            </Grid>

            <InvestiranjeEditorModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleSave}
                mode="create"
                allPosts={posts ?? []}
            />
        </Grid>
    )
}
