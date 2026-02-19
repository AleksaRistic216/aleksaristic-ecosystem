import { firebaseApp } from '@/app/firebase'
import { Layout } from '@/widgets/Layout'
import { Box, Button, CircularProgress, Grid, Typography } from '@mui/material'
import {
    equalTo,
    get,
    getDatabase,
    orderByChild,
    query,
    ref,
} from 'firebase/database'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import parse from 'html-react-parser'
import NextLink from 'next/link'
import { ArrowBack } from '@mui/icons-material'

const InvestiranjeSrc = () => {
    const router = useRouter()
    const src = router.query.src

    const [post, setPost] = useState(null)

    useEffect(() => {
        if (src == undefined) {
            setPost(null)
            return
        }

        const db = getDatabase(firebaseApp)
        const q = query(
            ref(db, '/investiranje'),
            orderByChild('src'),
            equalTo(src.toString())
        )

        get(q)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setPost(snapshot.val()[Object.keys(snapshot.val())[0]])
                } else {
                    console.log('No data available')
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }, [src])

    return post == null || post.text == null ? (
        <CircularProgress />
    ) : (
        <Layout>
            <Grid
                sx={{
                    overflowY: `auto`,
                    flex: 1,
                    minHeight: 0,
                }}
            >
                <Grid
                    container
                    justifyContent={`center`}
                    sx={{
                        py: { xs: 4, sm: 10 },
                        px: { xs: 2, sm: 4 },
                        maxWidth: `lg`,
                        margin: `auto`,
                    }}
                >
                    <Grid item xs={12} my={2}>
                        <Button
                            variant={`outlined`}
                            component={NextLink}
                            href={`/investiranje`}
                        >
                            <ArrowBack sx={{ marginRight: 1 }} /> Nazad
                        </Button>
                    </Grid>
                    <Grid item xs={12} my={2}>
                        <Typography component={`h1`} variant={`h4`}>
                            {post.title}
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{
                            '& img': { maxWidth: '100%', height: 'auto' },
                            '& table': { display: 'block', overflowX: 'auto', width: '100%' },
                            '& pre': { overflowX: 'auto' },
                            '& iframe': { maxWidth: '100%' },
                        }}>
                            {parse(post.text)}
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Layout>
    )
}

export default InvestiranjeSrc
