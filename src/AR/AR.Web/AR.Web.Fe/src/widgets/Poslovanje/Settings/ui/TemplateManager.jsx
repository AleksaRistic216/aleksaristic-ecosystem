import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import { Add, Edit, Delete, Close } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export const TemplateManager = () => {
    const [templates, setTemplates] = useState([])
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [name, setName] = useState('')
    const [htmlContent, setHtmlContent] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        return poslovanjService.onTemplates(setTemplates)
    }, [])

    const handleCreate = () => {
        setEditingTemplate(null)
        setName('')
        setHtmlContent('')
        setIsEditorOpen(true)
    }

    const handleEdit = (template) => {
        setEditingTemplate(template)
        setName(template.name)
        setHtmlContent(template.htmlContent || '')
        setIsEditorOpen(true)
    }

    const handleDelete = async (template) => {
        if (!confirm(`Delete template "${template.name}"?`)) return
        try {
            await poslovanjService.deleteTemplate(template.key)
            toast('Template deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast('Name is required', { type: 'warning' })
            return
        }
        setLoading(true)
        try {
            const data = { name: name.trim(), htmlContent }
            if (editingTemplate) {
                await poslovanjService.updateTemplate(
                    editingTemplate.key,
                    data,
                )
                toast('Template updated', { type: 'success' })
            } else {
                await poslovanjService.createTemplate(data)
                toast('Template created', { type: 'success' })
            }
            setIsEditorOpen(false)
        } catch (error) {
            toast(error.message || 'Failed to save', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Typography variant="h6">Print Templates</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreate}
                    sx={{ textTransform: 'none' }}
                    size="small"
                >
                    Add Template
                </Button>
            </Box>

            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Available template variables:
                </Typography>
                <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontFamily: 'monospace', lineHeight: 1.8 }}
                >
                    <strong>Invoice:</strong>{' '}
                    {'{{invoice.invoiceNumber}}'},{' '}
                    {'{{invoice.date}}'},{' '}
                    {'{{invoice.serviceAgreement}}'},{' '}
                    {'{{invoice.serviceStartDate}}'},{' '}
                    {'{{invoice.basisOfPayment}}'},{' '}
                    {'{{invoice.typeOfPayment}}'},{' '}
                    {'{{invoice.totalAmount}}'},{' '}
                    {'{{invoice.totalFormatted}}'},{' '}
                    {'{{invoice.currency}}'},{' '}
                    {'{{invoice.status}}'},{' '}
                    {'{{invoice.notes}}'}
                    <br />
                    <strong>Items loop:</strong>{' '}
                    {'{{#each invoice.items}}'} ...{' '}
                    {'{{this.description}}'},{' '}
                    {'{{this.amount}}'},{' '}
                    {'{{this.amountFormatted}}'} ...{' '}
                    {'{{/each}}'}
                    <br />
                    <strong>Receiver:</strong>{' '}
                    {'{{receiver.name}}'},{' '}
                    {'{{receiver.code}}'},{' '}
                    {'{{receiver.address}}'},{' '}
                    {'{{receiver.phone}}'},{' '}
                    {'{{receiver.email}}'},{' '}
                    {'{{receiver.representative}}'},{' '}
                    {'{{receiver.representativeTitle}}'},{' '}
                    {'{{receiver.bankName}}'},{' '}
                    {'{{receiver.accountNo}}'},{' '}
                    {'{{receiver.bankAddress}}'},{' '}
                    {'{{receiver.swift}}'},{' '}
                    {'{{receiver.correspondentBank}}'},{' '}
                    {'{{receiver.correspondentSwift}}'}
                    <br />
                    <strong>Provider:</strong>{' '}
                    {'{{provider.name}}'},{' '}
                    {'{{provider.address}}'},{' '}
                    {'{{provider.city}}'},{' '}
                    {'{{provider.email}}'},{' '}
                    {'{{provider.directorName}}'},{' '}
                    {'{{provider.directorNameCyrillic}}'},{' '}
                    {'{{provider.bankName}}'},{' '}
                    {'{{provider.bankAddress}}'},{' '}
                    {'{{provider.bic}}'},{' '}
                    {'{{provider.iban}}'}
                </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>
                                <strong>Name</strong>
                            </TableCell>
                            <TableCell align="center">
                                <strong>Actions</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={2}
                                    align="center"
                                    sx={{ py: 3, color: 'text.secondary' }}
                                >
                                    No templates yet
                                </TableCell>
                            </TableRow>
                        )}
                        {templates.map((t) => (
                            <TableRow key={t.key} hover>
                                <TableCell>{t.name}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(t)}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(t)}
                                        sx={{ color: '#d32f2f' }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={isEditorOpen}
                onClose={() => !loading && setIsEditorOpen(false)}
                fullWidth
                maxWidth="lg"
                PaperProps={{
                    sx: { borderRadius: 3, minHeight: '80vh' },
                }}
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
                        {editingTemplate ? 'Edit Template' : 'New Template'}
                    </Typography>
                    <IconButton
                        onClick={() => !loading && setIsEditorOpen(false)}
                        size="small"
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent
                    sx={{
                        pt: 3,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <TextField
                        label="Template Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        size="small"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        label="HTML Content"
                        fullWidth
                        multiline
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        disabled={loading}
                        sx={{
                            flex: 1,
                            '& .MuiInputBase-root': {
                                fontFamily: 'monospace',
                                fontSize: 13,
                            },
                            '& textarea': {
                                minHeight: '400px !important',
                            },
                        }}
                    />
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
                        onClick={() => !loading && setIsEditorOpen(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
