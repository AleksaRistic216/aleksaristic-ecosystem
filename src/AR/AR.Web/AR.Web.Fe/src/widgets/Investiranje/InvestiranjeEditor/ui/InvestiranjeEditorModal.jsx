import { investiranjeService } from '@/app/services/investiranjeService'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    Switch,
    TextField,
    Typography,
} from '@mui/material'
import { Close, Edit, Add } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { MarkdownEditor } from '@/widgets/Blog/BlogEditor/ui/MarkdownEditor'

const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
}

const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}/${month}/${day}`
}

export const InvestiranjeEditorModal = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode,
}) => {
    const [title, setTitle] = useState('')
    const [date, setDate] = useState(getTodayDate())
    const [src, setSrc] = useState('')
    const [markdown, setMarkdown] = useState('')
    const [isPinned, setIsPinned] = useState(false)
    const [loading, setLoading] = useState(false)
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    useEffect(() => {
        if (isOpen && initialData && mode === 'edit') {
            setTitle(initialData.data.title)
            setDate(initialData.data.date)
            setSrc(initialData.data.src)
            setIsPinned(initialData.data.isPinned || false)
            setMarkdown(initialData.data.text || '')
            setSlugManuallyEdited(true)
        } else if (isOpen && mode === 'create') {
            setTitle('')
            setDate(getTodayDate())
            setSrc('')
            setMarkdown('')
            setIsPinned(false)
            setSlugManuallyEdited(false)
        }
    }, [isOpen, initialData, mode])

    useEffect(() => {
        if (!slugManuallyEdited && title) {
            setSrc(generateSlug(title))
        }
    }, [title, slugManuallyEdited])

    const handleSlugChange = (value) => {
        setSrc(value)
        setSlugManuallyEdited(true)
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast('Naslov je obavezan', { type: 'warning' })
            return
        }
        if (!src.trim()) {
            toast('Slug je obavezan', { type: 'warning' })
            return
        }
        if (!date.trim()) {
            toast('Datum je obavezan', { type: 'warning' })
            return
        }

        setLoading(true)
        try {
            const isUnique = await investiranjeService.isSlugUnique(
                src,
                initialData?.key
            )
            if (!isUnique) {
                toast('Slug već postoji. Molimo izaberite drugi.', {
                    type: 'error',
                })
                setLoading(false)
                return
            }

            const htmlContent = DOMPurify.sanitize(
                await marked.parse(markdown)
            )

            const postData = {
                title: title.trim(),
                date: date.trim(),
                src: src.trim(),
                text: htmlContent,
                isPinned,
            }

            if (mode === 'create') {
                await investiranjeService.createPost(postData)
                toast('Članak je uspešno kreiran', { type: 'success' })
            } else if (initialData) {
                await investiranjeService.updatePost(initialData.key, postData)
                toast('Članak je uspešno ažuriran', { type: 'success' })
            }

            onSave()
            onClose()
        } catch (error) {
            toast(error.message || 'Greška pri čuvanju članka', {
                type: 'error',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{
                sx: {
                    minHeight: '85vh',
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {mode === 'create' ? (
                        <Add color="primary" />
                    ) : (
                        <Edit color="primary" />
                    )}
                    <Typography variant="h6" fontWeight={600}>
                        {mode === 'create' ? 'Novi članak' : 'Uredi članak'}
                    </Typography>
                    {isPinned && (
                        <Chip
                            label="Zakačen"
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    )}
                </Box>
                <IconButton
                    onClick={handleClose}
                    disabled={loading}
                    size="small"
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            Detalji članka
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Naslov"
                            fullWidth
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                            size="medium"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Datum"
                            fullWidth
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={loading}
                            placeholder="yyyy/MM/dd"
                            size="medium"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={isPinned}
                                    onChange={(e) =>
                                        setIsPinned(e.target.checked)
                                    }
                                    disabled={loading}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2">
                                    Zakači na vrh
                                </Typography>
                            }
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                px: 2,
                                py: 0.75,
                                m: 0,
                                width: '100%',
                                justifyContent: 'space-between',
                            }}
                            labelPlacement="start"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="URL Slug"
                            fullWidth
                            value={src}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            disabled={loading}
                            helperText={
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Pregled: /investiranje/
                                    <strong>{src || 'vaš-slug-ovde'}</strong>
                                </Typography>
                            }
                            size="medium"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 1.5 }}
                        >
                            Sadržaj (Markdown)
                        </Typography>
                        <MarkdownEditor
                            value={markdown}
                            onChange={setMarkdown}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                >
                    Otkaži
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ textTransform: 'none', minWidth: 120 }}
                >
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : mode === 'create' ? (
                        'Objavi'
                    ) : (
                        'Sačuvaj izmene'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
