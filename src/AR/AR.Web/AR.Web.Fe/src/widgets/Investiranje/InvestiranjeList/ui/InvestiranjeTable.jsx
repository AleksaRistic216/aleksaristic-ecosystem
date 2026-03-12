import { useAuth } from '@/app/context/AuthContext'
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
import {
    Delete,
    Edit,
    ExpandMore,
    ExpandLess,
    PushPin,
    Warning,
} from '@mui/icons-material'
import { Fragment, useState } from 'react'
import { toast } from 'react-toastify'
import { InvestiranjeTableContainerStyled } from '../styled/InvestiranjeTableContainerStyled'
import { useRouter } from 'next/router'
import { InvestiranjeEditorModal } from '../../InvestiranjeEditor/ui/InvestiranjeEditorModal'

export const InvestiranjeTable = ({ posts, onRefresh }) => {
    const router = useRouter()
    const { isAdmin } = useAuth()
    const [editingPost, setEditingPost] = useState(undefined)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [deletingPost, setDeletingPost] = useState(undefined)
    const [isDeleting, setIsDeleting] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState({})

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
        onRefresh()
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
            onRefresh()
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

    const toggleGroup = (key) => {
        setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    const sortPosts = (list) =>
        list?.slice().sort((x, y) => {
            if (x.data.isPinned !== y.data.isPinned)
                return (y.data.isPinned ? 1 : 0) - (x.data.isPinned ? 1 : 0)
            const xHasOrder = x.data.order != null
            const yHasOrder = y.data.order != null
            if (xHasOrder && yHasOrder) return x.data.order - y.data.order
            if (xHasOrder !== yHasOrder) return xHasOrder ? -1 : 1
            return x.data.date > y.data.date ? -1 : 1
        })

    // Separate top-level and child posts
    const topLevelPosts = posts?.filter((p) => !p.data.parentKey) ?? []
    const childrenByParent = {}
    posts?.forEach((p) => {
        if (p.data.parentKey) {
            if (!childrenByParent[p.data.parentKey])
                childrenByParent[p.data.parentKey] = []
            childrenByParent[p.data.parentKey].push(p)
        }
    })
    // Sort children within each group
    Object.keys(childrenByParent).forEach((key) => {
        childrenByParent[key] = sortPosts(childrenByParent[key])
    })

    const sortedTopLevel = sortPosts(topLevelPosts)

    const renderAdminActions = (post) =>
        isAdmin ? (
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
                            onClick={(e) => handleEdit(post, e)}
                            sx={{
                                '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Obriši članak">
                        <IconButton
                            size="small"
                            onClick={(e) => handleDeleteClick(post, e)}
                            sx={{
                                '&:hover': {
                                    bgcolor: 'error.main',
                                    color: 'white',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </TableCell>
        ) : null

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
                        {sortedTopLevel?.map((post) => {
                            const children = childrenByParent[post.key]
                            const hasChildren = children && children.length > 0
                            const isExpanded = !!expandedGroups[post.key]

                            return hasChildren ? (
                                <Fragment key={post.key}>
                                    <TableRow
                                        onClick={() =>
                                            toggleGroup(post.key)
                                        }
                                        sx={{
                                            '&:last-child td, &:last-child th':
                                                { border: 0 },
                                            ...(post.data.listingColor && {
                                                background: `linear-gradient(to right, transparent, ${post.data.listingColor}30)`,
                                            }),
                                        }}
                                    >
                                        <TableCell
                                            component="th"
                                            scope="row"
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {isExpanded ? (
                                                    <ExpandLess
                                                        sx={{
                                                            fontSize: '1.2em',
                                                            mr: 1,
                                                            color: 'text.secondary',
                                                        }}
                                                    />
                                                ) : (
                                                    <ExpandMore
                                                        sx={{
                                                            fontSize: '1.2em',
                                                            mr: 1,
                                                            color: 'text.secondary',
                                                        }}
                                                    />
                                                )}
                                                {post.data.isPinned && (
                                                    <PushPin
                                                        sx={{
                                                            fontSize: '1em',
                                                            transform:
                                                                'translateY(3px)',
                                                            marginRight: 1,
                                                        }}
                                                    />
                                                )}
                                                {post.data.title}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">
                                            {post.data.date}
                                        </TableCell>
                                        {renderAdminActions(post)}
                                    </TableRow>
                                    {children.map((child) => (
                                        <TableRow
                                            key={child.key}
                                            onClick={() =>
                                                router.push(
                                                    `/investiranje/${child.data.src}`
                                                )
                                            }
                                            sx={{
                                                display: isExpanded
                                                    ? 'table-row'
                                                    : 'none',
                                                ...((child.data.listingColor || post.data.listingColor)
                                                    ? {
                                                          background: `linear-gradient(to right, transparent, ${child.data.listingColor || post.data.listingColor}30)`,
                                                      }
                                                    : {
                                                          bgcolor: (theme) =>
                                                              theme.palette.mode ===
                                                              'dark'
                                                                  ? 'rgba(255,255,255,0.06)'
                                                                  : 'rgba(0,0,0,0.04)',
                                                      }),
                                                borderLeft: (theme) =>
                                                    `3px solid ${theme.palette.primary.main}`,
                                                '&:last-child td, &:last-child th':
                                                    { border: 0 },
                                            }}
                                        >
                                            <TableCell
                                                component="th"
                                                scope="row"
                                                sx={{ pl: 6 }}
                                            >
                                                {child.data.title}
                                            </TableCell>
                                            <TableCell align="right">
                                                {child.data.date}
                                            </TableCell>
                                            {renderAdminActions(child)}
                                        </TableRow>
                                    ))}
                                </Fragment>
                            ) : (
                                <TableRow
                                    onClick={() =>
                                        router.push(
                                            `/investiranje/${post.data.src}`
                                        )
                                    }
                                    key={post.key}
                                    sx={{
                                        '&:last-child td, &:last-child th': {
                                            border: 0,
                                        },
                                        ...(post.data.listingColor && {
                                            background: `linear-gradient(to right, transparent, ${post.data.listingColor}30)`,
                                        }),
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        {post.data.isPinned && (
                                            <PushPin
                                                sx={{
                                                    fontSize: '1em',
                                                    transform:
                                                        'translateY(3px)',
                                                    marginRight: 1,
                                                }}
                                            />
                                        )}
                                        {post.data.title}
                                    </TableCell>
                                    <TableCell align="right">
                                        {post.data.date}
                                    </TableCell>
                                    {renderAdminActions(post)}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </InvestiranjeTableContainerStyled>

            <InvestiranjeEditorModal
                isOpen={isEditorOpen}
                onClose={handleEditorClose}
                onSave={handleSave}
                initialData={editingPost}
                mode="edit"
                allPosts={posts ?? []}
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
