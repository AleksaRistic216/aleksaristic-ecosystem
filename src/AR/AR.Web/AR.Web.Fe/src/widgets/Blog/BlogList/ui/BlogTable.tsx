import { useAuth } from '@/app/context/AuthContext'
import { firebaseApp } from '@/app/firebase'
import { blogService } from '@/app/services/blogService'
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
import { BlogTableContainerStyled } from '../styled/BlogTableContainerStyled'
import { useRouter } from 'next/router'
import { BlogEditorModal } from '../../BlogEditor/ui/BlogEditorModal'
import { IBlogWithKey } from '../../BlogEditor/models/IBlogEditorProps'

export const BlogTable = (): JSX.Element => {
    const router = useRouter()
    const { isAdmin } = useAuth()
    const [blogs, setBlogs] = useState<IBlogWithKey[] | undefined>(undefined)
    const [editingBlog, setEditingBlog] = useState<IBlogWithKey | undefined>(
        undefined
    )
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [deletingBlog, setDeletingBlog] = useState<IBlogWithKey | undefined>(
        undefined
    )
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchBlogs = useCallback(() => {
        const db = getDatabase(firebaseApp)
        const q = query(ref(db, '/blogs'))

        get(q)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val()
                    const blogsWithKeys: IBlogWithKey[] = Object.keys(data)
                        .filter((key) => data[key] != null)
                        .map((key) => ({
                            key,
                            data: data[key],
                        }))
                    setBlogs(blogsWithKeys)
                } else {
                    setBlogs([])
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }, [])

    useEffect(() => {
        fetchBlogs()
    }, [fetchBlogs])

    const handleEdit = (blog: IBlogWithKey, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingBlog(blog)
        setIsEditorOpen(true)
    }

    const handleEditorClose = () => {
        setIsEditorOpen(false)
        setEditingBlog(undefined)
    }

    const handleSave = () => {
        fetchBlogs()
    }

    const handleDeleteClick = (blog: IBlogWithKey, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeletingBlog(blog)
    }

    const handleDeleteConfirm = async () => {
        if (!deletingBlog) return

        setIsDeleting(true)
        try {
            await blogService.deleteBlog(deletingBlog.key)
            toast('Blog post deleted successfully', { type: 'success' })
            fetchBlogs()
        } catch (error: any) {
            toast(error.message || 'Failed to delete blog post', {
                type: 'error',
            })
        } finally {
            setIsDeleting(false)
            setDeletingBlog(undefined)
        }
    }

    const handleDeleteCancel = () => {
        setDeletingBlog(undefined)
    }

    const sortedBlogs = blogs
        ?.slice()
        .sort((x, y) => {
            if (x.data.isPinned !== y.data.isPinned)
                return (y.data.isPinned ? 1 : 0) - (x.data.isPinned ? 1 : 0)
            return x.data.date > y.data.date ? -1 : 1
        })

    return blogs == undefined ? (
        <CircularProgress />
    ) : (
        <Grid item sm={12}>
            <BlogTableContainerStyled component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell align="right">
                                Date (yyyy/MM/dd)
                            </TableCell>
                            {isAdmin && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedBlogs?.map((blog) => (
                            <TableRow
                                onClick={() => {
                                    router.push(`/blog/${blog.data.src}`)
                                }}
                                key={blog.key}
                                sx={{
                                    '&:last-child td, &:last-child th': {
                                        border: 0,
                                    },
                                }}
                            >
                                <TableCell component="th" scope="row">
                                    {blog.data.isPinned && (
                                        <PushPin
                                            sx={{
                                                fontSize: `1em`,
                                                transform: `translateY(3px)`,
                                                marginRight: 1,
                                            }}
                                        />
                                    )}
                                    {blog.data.title}
                                </TableCell>
                                <TableCell align="right">
                                    {blog.data.date}
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
                                            <Tooltip title="Edit post">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) =>
                                                        handleEdit(blog, e)
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
                                            <Tooltip title="Delete post">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) =>
                                                        handleDeleteClick(
                                                            blog,
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
            </BlogTableContainerStyled>

            <BlogEditorModal
                isOpen={isEditorOpen}
                onClose={handleEditorClose}
                onSave={handleSave}
                initialData={editingBlog}
                mode="edit"
            />

            <Dialog
                open={!!deletingBlog}
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
                        Delete Blog Post
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary">
                        Are you sure you want to delete{' '}
                        <strong>&quot;{deletingBlog?.data.title}&quot;</strong>?
                    </Typography>
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 1 }}
                    >
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleDeleteCancel}
                        disabled={isDeleting}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
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
                            'Delete'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}
