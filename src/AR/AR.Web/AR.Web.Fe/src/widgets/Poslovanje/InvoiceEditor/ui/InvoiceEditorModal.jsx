import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import { Close, Add, Delete } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const getTodayDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ]
    return `${day} ${months[today.getMonth()]} ${today.getFullYear()}`
}

const normalizeItems = (items) => {
    if (!items) return [{ description: '', amount: '' }]
    if (Array.isArray(items)) return items
    return Object.values(items)
}

export const InvoiceEditorModal = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode,
    receivers,
    templates,
    provider,
}) => {
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [date, setDate] = useState(getTodayDate())
    const [receiverId, setReceiverId] = useState('')
    const [serviceAgreement, setServiceAgreement] = useState('')
    const [serviceStartDate, setServiceStartDate] = useState('')
    const [basisOfPayment, setBasisOfPayment] = useState('')
    const [typeOfPayment, setTypeOfPayment] = useState('')
    const [items, setItems] = useState([{ description: '', amount: '' }])
    const [currency, setCurrency] = useState('EUR')
    const [status, setStatus] = useState('draft')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && initialData && mode === 'edit') {
            setInvoiceNumber(initialData.invoiceNumber || '')
            setDate(initialData.date || '')
            setReceiverId(initialData.receiverId || '')
            setServiceAgreement(initialData.serviceAgreement || '')
            setServiceStartDate(initialData.serviceStartDate || '')
            setBasisOfPayment(initialData.basisOfPayment || '')
            setTypeOfPayment(initialData.typeOfPayment || '')
            setItems(normalizeItems(initialData.items))
            setCurrency(initialData.currency || 'EUR')
            setStatus(initialData.status || 'draft')
            setNotes(initialData.notes || '')
        } else if (isOpen && mode === 'create') {
            setInvoiceNumber('')
            setDate(getTodayDate())
            setReceiverId('')
            setServiceAgreement('')
            setServiceStartDate('')
            setBasisOfPayment('')
            setTypeOfPayment('')
            setItems([{ description: '', amount: '' }])
            setCurrency('EUR')
            setStatus('draft')
            setNotes('')
        }
    }, [isOpen, initialData, mode])

    useEffect(() => {
        if (receiverId && mode === 'create') {
            const receiver = receivers.find((r) => r.key === receiverId)
            if (receiver?.defaultCurrency) {
                setCurrency(receiver.defaultCurrency)
            }
            if (receiver?.invoicePrefix && !invoiceNumber.startsWith(receiver.invoicePrefix)) {
                setInvoiceNumber(receiver.invoicePrefix)
            }
        }
    }, [receiverId, mode, receivers])

    const handleAddItem = () => {
        setItems([...items, { description: '', amount: '' }])
    }

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const handleItemChange = (index, field, value) => {
        const updated = [...items]
        updated[index] = { ...updated[index], [field]: value }
        setItems(updated)
    }

    const totalAmount = items.reduce(
        (sum, item) => sum + (parseFloat(item.amount) || 0),
        0,
    )

    const handleSave = async () => {
        if (!invoiceNumber.trim()) {
            toast('Invoice number is required', { type: 'warning' })
            return
        }
        if (!receiverId) {
            toast('Please select a receiver', { type: 'warning' })
            return
        }

        setLoading(true)
        try {
            const invoiceData = {
                invoiceNumber: invoiceNumber.trim(),
                date: date.trim(),
                receiverId,
                serviceAgreement: serviceAgreement.trim(),
                serviceStartDate: serviceStartDate.trim(),
                basisOfPayment: basisOfPayment.trim(),
                typeOfPayment: typeOfPayment.trim(),
                items: items.filter((i) => i.description || i.amount),
                totalAmount,
                currency,
                status,
                notes: notes.trim(),
            }

            if (status === 'sent' || status === 'paid') {
                const receiver = receivers.find((r) => r.key === receiverId)
                if (receiver) {
                    const { key, ...receiverData } = receiver
                    invoiceData.receiverSnapshot = receiverData
                    const tpl = templates?.find(
                        (t) => t.key === receiver.templateId,
                    )
                    if (tpl) {
                        invoiceData.templateSnapshot = tpl.htmlContent
                    }
                }
                if (provider) {
                    invoiceData.providerSnapshot = provider
                }
            } else {
                invoiceData.receiverSnapshot = null
                invoiceData.providerSnapshot = null
                invoiceData.templateSnapshot = null
            }

            if (mode === 'create') {
                await poslovanjService.createInvoice(invoiceData)
                toast('Invoice created', { type: 'success' })
            } else {
                await poslovanjService.updateInvoice(
                    initialData.key,
                    invoiceData,
                )
                toast('Invoice updated', { type: 'success' })
            }

            onSave()
            onClose()
        } catch (error) {
            toast(error.message || 'Failed to save invoice', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={() => !loading && onClose()}
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
                    {mode === 'create' ? 'New Invoice' : 'Edit Invoice'}
                </Typography>
                <IconButton
                    onClick={() => !loading && onClose()}
                    size="small"
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={4}>
                        <TextField
                            label="Invoice Number"
                            fullWidth
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            disabled={loading}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            label="Date"
                            fullWidth
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={loading}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={status}
                                label="Status"
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={loading}
                            >
                                <MenuItem value="draft">Draft</MenuItem>
                                <MenuItem value="sent">Sent</MenuItem>
                                <MenuItem value="paid">Paid</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={8}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Receiver</InputLabel>
                            <Select
                                value={receiverId}
                                label="Receiver"
                                onChange={(e) => setReceiverId(e.target.value)}
                                disabled={loading}
                            >
                                {receivers.map((r) => (
                                    <MenuItem key={r.key} value={r.key}>
                                        {r.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Currency</InputLabel>
                            <Select
                                value={currency}
                                label="Currency"
                                onChange={(e) => setCurrency(e.target.value)}
                                disabled={loading}
                            >
                                <MenuItem value="EUR">EUR</MenuItem>
                                <MenuItem value="USD">USD</MenuItem>
                                <MenuItem value="RSD">RSD</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Service Agreement"
                            fullWidth
                            value={serviceAgreement}
                            onChange={(e) =>
                                setServiceAgreement(e.target.value)
                            }
                            disabled={loading}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            label="Service Start Date"
                            fullWidth
                            value={serviceStartDate}
                            onChange={(e) =>
                                setServiceStartDate(e.target.value)
                            }
                            disabled={loading}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            label="Basis of Payment"
                            fullWidth
                            value={basisOfPayment}
                            onChange={(e) =>
                                setBasisOfPayment(e.target.value)
                            }
                            disabled={loading}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={4}>
                        <TextField
                            label="Type of Payment"
                            fullWidth
                            value={typeOfPayment}
                            onChange={(e) => setTypeOfPayment(e.target.value)}
                            disabled={loading}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Line Items
                        </Typography>
                        {items.map((item, index) => (
                            <Grid
                                container
                                spacing={1}
                                key={index}
                                sx={{ mb: 1 }}
                            >
                                <Grid item xs={8}>
                                    <TextField
                                        label="Description"
                                        fullWidth
                                        value={item.description}
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        disabled={loading}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        label="Amount"
                                        fullWidth
                                        value={item.amount}
                                        type="number"
                                        onChange={(e) =>
                                            handleItemChange(
                                                index,
                                                'amount',
                                                e.target.value,
                                            )
                                        }
                                        disabled={loading}
                                        size="small"
                                    />
                                </Grid>
                                <Grid
                                    item
                                    xs={1}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {items.length > 1 && (
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleRemoveItem(index)
                                            }
                                            disabled={loading}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={handleAddItem}
                            disabled={loading}
                            sx={{ textTransform: 'none' }}
                        >
                            Add Item
                        </Button>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            textAlign="right"
                        >
                            Total: {totalAmount.toLocaleString()} {currency}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            label="Notes"
                            fullWidth
                            multiline
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={loading}
                            size="small"
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
                    onClick={() => !loading && onClose()}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                    sx={{ textTransform: 'none', minWidth: 100 }}
                >
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : mode === 'create' ? (
                        'Create'
                    ) : (
                        'Save'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
