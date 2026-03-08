import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material'
import {
    Add,
    Close,
    Delete,
    InsertDriveFile,
    OpenInNew,
} from '@mui/icons-material'
import { useRef, useState } from 'react'
import { toast } from 'react-toastify'

const normalizeAttachments = (attachments) => {
    if (!attachments) return []
    if (Array.isArray(attachments)) {
        return attachments.map((a, i) => ({ key: String(i), ...a }))
    }
    return Object.entries(attachments).map(([key, val]) => ({ key, ...val }))
}

export const AttachmentsDialog = ({ isOpen, onClose, invoice }) => {
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    if (!invoice) return null

    const attachments = normalizeAttachments(invoice.attachments)

    const handleAdd = () => {
        fileInputRef.current.value = ''
        fileInputRef.current.click()
    }

    const handleFileSelected = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            await poslovanjService.addAttachment(invoice.key, file)
            toast('Attachment added', { type: 'success' })
        } catch (error) {
            toast('Failed to add attachment', { type: 'error' })
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = async (attachmentKey) => {
        if (!confirm('Remove this attachment?')) return
        try {
            await poslovanjService.removeAttachment(
                invoice.key,
                attachmentKey,
            )
            toast('Attachment removed', { type: 'success' })
        } catch (error) {
            toast('Failed to remove attachment', { type: 'error' })
        }
    }

    const handleView = (attachment) => {
        window.open(attachment.data, '_blank')
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Typography variant="h6" fontWeight={600}>
                    Attachments
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {attachments.length === 0 && (
                    <Typography
                        color="text.secondary"
                        sx={{ py: 3, textAlign: 'center' }}
                    >
                        No attachments yet
                    </Typography>
                )}
                <List disablePadding>
                    {attachments.map((att) => (
                        <ListItem
                            key={att.key}
                            secondaryAction={
                                <Box>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleView(att)}
                                        title="Open"
                                    >
                                        <OpenInNew fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemove(att.key)}
                                        title="Remove"
                                        sx={{ color: '#d32f2f' }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                            }
                            sx={{
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                                mb: 0.5,
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <InsertDriveFile
                                    fontSize="small"
                                    color="action"
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary={att.name}
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    noWrap: true,
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                />
                <Button
                    size="small"
                    startIcon={
                        uploading ? (
                            <CircularProgress size={16} />
                        ) : (
                            <Add />
                        )
                    }
                    onClick={handleAdd}
                    disabled={uploading}
                    sx={{ textTransform: 'none', mt: 1 }}
                >
                    Add Attachment
                </Button>
            </DialogContent>
        </Dialog>
    )
}
