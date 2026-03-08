import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
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

const emptyReceiver = {
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    representative: '',
    representativeTitle: '',
    bankName: '',
    accountNo: '',
    bankAddress: '',
    swift: '',
    correspondentBank: '',
    correspondentSwift: '',
    templateId: '',
    defaultCurrency: 'EUR',
    invoicePrefix: '',
}

export const ReceiverManager = () => {
    const [receivers, setReceivers] = useState([])
    const [templates, setTemplates] = useState([])
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingReceiver, setEditingReceiver] = useState(null)
    const [form, setForm] = useState(emptyReceiver)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const unsub1 = poslovanjService.onReceivers(setReceivers)
        const unsub2 = poslovanjService.onTemplates(setTemplates)
        return () => {
            unsub1()
            unsub2()
        }
    }, [])

    const handleCreate = () => {
        setEditingReceiver(null)
        setForm(emptyReceiver)
        setIsEditorOpen(true)
    }

    const handleEdit = (receiver) => {
        setEditingReceiver(receiver)
        setForm({ ...emptyReceiver, ...receiver })
        setIsEditorOpen(true)
    }

    const handleDelete = async (receiver) => {
        if (!confirm(`Delete receiver ${receiver.name}?`)) return
        try {
            await poslovanjService.deleteReceiver(receiver.key)
            toast('Receiver deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleSave = async () => {
        if (!form.name.trim()) {
            toast('Name is required', { type: 'warning' })
            return
        }
        setLoading(true)
        try {
            const data = { ...form, name: form.name.trim() }
            delete data.key
            if (editingReceiver) {
                await poslovanjService.updateReceiver(
                    editingReceiver.key,
                    data,
                )
                toast('Receiver updated', { type: 'success' })
            } else {
                await poslovanjService.createReceiver(data)
                toast('Receiver created', { type: 'success' })
            }
            setIsEditorOpen(false)
        } catch (error) {
            toast(error.message || 'Failed to save', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const f = (field) => ({
        value: form[field] || '',
        onChange: (e) =>
            setForm((prev) => ({ ...prev, [field]: e.target.value })),
        disabled: loading,
        size: 'small',
    })

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                }}
            >
                <Typography variant="h6">Receivers</Typography>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreate}
                    sx={{ textTransform: 'none' }}
                    size="small"
                >
                    Add Receiver
                </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell>
                                <strong>Name</strong>
                            </TableCell>
                            <TableCell>
                                <strong>Code</strong>
                            </TableCell>
                            <TableCell>
                                <strong>Currency</strong>
                            </TableCell>
                            <TableCell>
                                <strong>Template</strong>
                            </TableCell>
                            <TableCell align="center">
                                <strong>Actions</strong>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {receivers.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    align="center"
                                    sx={{ py: 3, color: 'text.secondary' }}
                                >
                                    No receivers yet
                                </TableCell>
                            </TableRow>
                        )}
                        {receivers.map((r) => (
                            <TableRow key={r.key} hover>
                                <TableCell>{r.name}</TableCell>
                                <TableCell>{r.code}</TableCell>
                                <TableCell>{r.defaultCurrency}</TableCell>
                                <TableCell>
                                    {templates.find(
                                        (t) => t.key === r.templateId,
                                    )?.name || 'None'}
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(r)}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(r)}
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
                maxWidth="md"
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
                        {editingReceiver ? 'Edit Receiver' : 'Add Receiver'}
                    </Typography>
                    <IconButton
                        onClick={() => !loading && setIsEditorOpen(false)}
                        size="small"
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                            <TextField
                                label="Company Name"
                                fullWidth
                                {...f('name')}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <TextField
                                label="Tax Code"
                                fullWidth
                                {...f('code')}
                            />
                        </Grid>
                        <Grid item xs={3}>
                            <TextField
                                label="Invoice Prefix"
                                fullWidth
                                {...f('invoicePrefix')}
                                placeholder="e.g. PIN-"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Address"
                                fullWidth
                                {...f('address')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Phone"
                                fullWidth
                                {...f('phone')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Email"
                                fullWidth
                                {...f('email')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Representative"
                                fullWidth
                                {...f('representative')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Representative Title"
                                fullWidth
                                {...f('representativeTitle')}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Bank Details
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Bank Name"
                                fullWidth
                                {...f('bankName')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Account No"
                                fullWidth
                                {...f('accountNo')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Bank Address"
                                fullWidth
                                {...f('bankAddress')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="SWIFT"
                                fullWidth
                                {...f('swift')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Correspondent Bank"
                                fullWidth
                                {...f('correspondentBank')}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                label="Correspondent SWIFT"
                                fullWidth
                                {...f('correspondentSwift')}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography
                                variant="subtitle2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Settings
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Default Currency</InputLabel>
                                <Select
                                    value={form.defaultCurrency || 'EUR'}
                                    label="Default Currency"
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            defaultCurrency: e.target.value,
                                        }))
                                    }
                                    disabled={loading}
                                >
                                    <MenuItem value="EUR">EUR</MenuItem>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="RSD">RSD</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Print Template</InputLabel>
                                <Select
                                    value={form.templateId || ''}
                                    label="Print Template"
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            templateId: e.target.value,
                                        }))
                                    }
                                    disabled={loading}
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {templates.map((t) => (
                                        <MenuItem key={t.key} value={t.key}>
                                            {t.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
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
