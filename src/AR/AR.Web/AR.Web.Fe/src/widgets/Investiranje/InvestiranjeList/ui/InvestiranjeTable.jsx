import { useAuth } from '@/app/context/AuthContext'
import { firebaseApp } from '@/app/firebase'
import { investiranjeService } from '@/app/services/investiranjeService'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material'
import { Delete, Edit, PushPin, Warning } from '@mui/icons-material'
import { get, getDatabase, query, ref } from 'firebase/database'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { InvestiranjeTableContainerStyled } from '../styled/InvestiranjeTableContainerStyled'
import { useRouter } from 'next/router'
import { InvestiranjeEditorModal } from '../../InvestiranjeEditor/ui/InvestiranjeEditorModal'

export const InvestiranjeTable = () => {
    const router = useRouter()
    const { isAdmin } = useAuth()
    const [posts, setPosts] = useState(undefined)
    const [editingPost, setEditingPost] = useState(undefined)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [deletingPost, setDeletingPost] = useState(undefined)
    const [isDeleting, setIsDeleting] = useState(false)

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

    const handleEdit = (post, e) => {
        e.stopPropagation()
        setEditingPost(post)
        setIsEditorOpen(true)
    }

    const handleEditorClose = () => {
        setIsEditorOpen(false)
        setEditingPost(undefined)
    }

    const handleSave = () => {
        fetchPosts()
    }

    const handleDeleteClick = (post, e) => {
        e.stopPropagation()
        setDeletingPost(post)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingPost) return

        setIsDeleting(true)
        try {
            await investiranjeService.deletePost(deletingPost.key)
            toast('Članak je uspešno obrisan', { type: 'success' })
            fetchPosts()
        } catch (error) {
            toast(error.message || 'Greška pri brisanju članka', {
                type: 'error',
            })
        } finally {
            setIsDeleting(false)
            setDeletingPost(undefined)
        }
    }

    const handleDeleteCancel = () => {
        setDeletingPost(undefined)
    }

    const sortedPosts = posts
        ?.slice()
        .sort((x, y) => {
            if (x.data.isPinned !== y.data.isPinned)
                return (y.data.isPinned ? 1 : 0) - (x.data.isPinned ? 1 : 0)
            return x.data.date > y.data.date ? -1 : 1
        })

    return posts == undefined ? (
        <CircularProgress />
    ) : (
        <Grid item sm={12}>
            <InvestiranjeTableContainerStyled component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Naslov</TableCell>
                            <TableCell align="right">
                                Datum (yyyy/MM/dd)
                            </TableCell>
                            {isAdmin && <TableCell align="right">Akcije</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedPosts?.map((post) => (
                            <TableRow
                                onClick={() => {
                                    router.push(`/investiranje/${post.data.src}`)
                                }}
                                key={post.key}
                                sx={{
                                    '&:last-child td, &:last-child th': {
                                        border: 0,
                                    },
                                }}
                            >
                                <TableCell component="th" scope="row">
                                    {post.data.isPinned && (
                                        <PushPin
                                            sx={{
                                                fontSize: `1em`,
                                                transform: `translateY(3px)`,
                                                marginRight: 1,
                                            }}
                                        />
                                    )}
                                    {post.data.title}
                                </TableCell>
                                <TableCell align="right">
                                    {post.data.date}
                                </TableCell>
                                {isAdmin && (
                                    <TableCell align="right">
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                gap: 0.5,
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <Tooltip title="Uredi članak">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) =>
                                                        handleEdit(post, e)
                                                    }
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor:
                                                                'primary.main',
                                                            color: 'white',
                                                        },
                                                        transition:
                                                            'all 0.15s ease',
                                                    }}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Obriši članak">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) =>
                                                        handleDeleteClick(
                                                            post,
                                                            e
                                                        )
                                                    }
                                                    sx={{
                                                        '&:hover': {
                                                            bgcolor:
                                                                'error.main',
                                                            color: 'white',
                                                        },
                                                        transition:
                                                            'all 0.15s ease',
                                                    }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </InvestiranjeTableContainerStyled>

            <InvestiranjeEditorModal
                isOpen={isEditorOpen}
                onClose={handleEditorClose}
                onSave={handleSave}
                initialData={editingPost}
                mode="edit"
            />

            <Dialog
                open={!!deletingPost}
                onClose={handleDeleteCancel}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Warning color="error" />
                        Obriši članak
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary">
                        Da li ste sigurni da želite da obrišete{' '}
                        <strong>&quot;{deletingPost?.data.title}&quot;</strong>?
                    </Typography>
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 1 }}
                    >
                        Ova akcija se ne može poništiti.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleDeleteCancel}
                        disabled={isDeleting}
                        sx={{ textTransform: 'none' }}
                    >
                        Otkaži
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                        sx={{ textTransform: 'none', minWidth: 100 }}
                    >
                        {isDeleting ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Obriši'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}
