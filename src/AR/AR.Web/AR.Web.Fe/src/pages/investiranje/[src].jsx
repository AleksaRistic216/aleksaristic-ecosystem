import { firebaseApp } from '@/app/firebase'
import { useAuth } from '@/app/context/AuthContext'
import { Layout } from '@/widgets/Layout'
import { InvestiranjeEditorModal } from '@/widgets/Investiranje'
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    Paper,
    Tooltip,
    Typography,
} from '@mui/material'
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
import { ArrowBack, ArrowForward, Edit, Info } from '@mui/icons-material'

const InvestiranjeSrc = () => {
    const router = useRouter()
    const { isAdmin } = useAuth()
    const src = router.query.src

    const [post, setPost] = useState(null)
    const [postKey, setPostKey] = useState(null)
    const [nextPost, setNextPost] = useState(null)
    const [allPosts, setAllPosts] = useState([])
    const [combinedNotes, setCombinedNotes] = useState([])
    const [isEditorOpen, setIsEditorOpen] = useState(false)

    useEffect(() => {
        if (src == undefined) {
            setPost(null)
            setNextPost(null)
            return
        }

        const db = getDatabase(firebaseApp)
        const q = query(
            ref(db, '/investiranje'),
            orderByChild('src'),
            equalTo(src.toString())
        )

        get(q)
            .then(async (snapshot) => {
                if (!snapshot.exists()) {
                    console.log('No data available')
                    return
                }

                const key = Object.keys(snapshot.val())[0]
                const data = snapshot.val()[key]

                // Fetch all posts to check parent status and find siblings
                const allSnap = await get(
                    query(ref(db, '/investiranje'))
                )
                const allData = allSnap.exists() ? allSnap.val() : {}
                setAllPosts(
                    Object.keys(allData)
                        .filter((k) => allData[k] != null)
                        .map((k) => ({ key: k, data: allData[k] }))
                )

                // If this post is a parent (has children), redirect to list
                const hasChildren = Object.keys(allData).some(
                    (k) =>
                        allData[k] != null &&
                        allData[k].parentKey === key
                )
                if (hasChildren) {
                    router.replace('/investiranje')
                    return
                }

                setPost(data)
                setPostKey(key)

                // Collect notes: parent notes (if inherited) + own notes
                const ownNotes = data.notes || []
                let parentNotes = []
                if (
                    data.parentKey &&
                    data.inheritParentNotes !== false &&
                    allData[data.parentKey]
                ) {
                    parentNotes = allData[data.parentKey].notes || []
                }
                setCombinedNotes([...parentNotes, ...ownNotes])

                // If this post has a parent, find siblings for "read next"
                if (data.parentKey) {
                    const siblings = Object.keys(allData)
                        .filter(
                            (k) =>
                                allData[k] != null &&
                                allData[k].parentKey === data.parentKey
                        )
                        .map((k) => ({ key: k, data: allData[k] }))
                        .sort((a, b) => {
                            const aHas = a.data.order != null
                            const bHas = b.data.order != null
                            if (aHas && bHas)
                                return a.data.order - b.data.order
                            if (aHas !== bHas) return aHas ? -1 : 1
                            return a.data.date > b.data.date ? -1 : 1
                        })

                    const currentIndex = siblings.findIndex(
                        (s) => s.key === key
                    )
                    if (
                        currentIndex !== -1 &&
                        currentIndex < siblings.length - 1
                    ) {
                        setNextPost(siblings[currentIndex + 1])
                    } else {
                        setNextPost(null)
                    }
                } else {
                    setNextPost(null)
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
                    <Grid
                        item
                        xs={12}
                        my={2}
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Button
                            variant={`outlined`}
                            component={NextLink}
                            href={`/investiranje`}
                        >
                            <ArrowBack sx={{ marginRight: 1 }} /> Nazad
                        </Button>
                        {isAdmin && (
                            <Tooltip title="Uredi članak">
                                <IconButton
                                    onClick={() => setIsEditorOpen(true)}
                                    sx={{
                                        '&:hover': {
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                        },
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Grid>
                    <Grid item xs={12} my={2}>
                        <Typography component={`h1`} variant={`h4`}>
                            {post.title}
                        </Typography>
                    </Grid>
                    {combinedNotes.length > 0 && (
                        <Grid item xs={12} sx={{ mb: 2 }}>
                            {combinedNotes.map((note, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        mb: 1.5,
                                        px: 2.5,
                                        py: 1.5,
                                        borderLeft: '4px solid #f5a623',
                                        bgcolor: 'rgba(245, 166, 35, 0.08)',
                                        borderRadius: '0 8px 8px 0',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 1.5,
                                    }}
                                >
                                    <Info
                                        sx={{
                                            color: '#f5a623',
                                            fontSize: '1.2rem',
                                            mt: 0.2,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'text.primary',
                                            fontStyle: 'italic',
                                        }}
                                    >
                                        {note}
                                    </Typography>
                                </Box>
                            ))}
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                '& img': {
                                    maxWidth: '100%',
                                    height: 'auto',
                                },
                                '& table': {
                                    display: 'block',
                                    overflowX: 'auto',
                                    width: '100%',
                                },
                                '& pre': { overflowX: 'auto' },
                                '& iframe': { maxWidth: '100%' },
                            }}
                        >
                            {parse(post.text)}
                        </Box>
                    </Grid>
                    {nextPost && (
                        <Grid item xs={12} mt={6}>
                            <Divider sx={{ mb: 3 }} />
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: (theme) =>
                                            theme.palette.mode === 'dark'
                                                ? 'grey.900'
                                                : 'primary.50',
                                        transform: 'translateX(4px)',
                                    },
                                }}
                                onClick={() =>
                                    router.push(
                                        `/investiranje/${nextPost.data.src}`
                                    )
                                }
                            >
                                <Typography
                                    variant="overline"
                                    color="text.secondary"
                                    sx={{ letterSpacing: 1 }}
                                >
                                    Pročitaj sledeće
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mt: 0.5,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        fontWeight={600}
                                    >
                                        {nextPost.data.title}
                                    </Typography>
                                    <ArrowForward color="primary" />
                                </Box>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Grid>
            <InvestiranjeEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={() => router.reload()}
                initialData={
                    postKey ? { key: postKey, data: post } : undefined
                }
                mode="edit"
                allPosts={allPosts}
            />
        </Layout>
    )
}

export default InvestiranjeSrc
