import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import {
    AttachFile,
    Close,
    Delete,
    InsertDriveFile,
    OpenInNew,
} from '@mui/icons-material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const normalizeAttachments = (attachments) => {
    if (!attachments) return []
    if (Array.isArray(attachments))
        return attachments.map((a, i) => ({ key: String(i), ...a }))
    return Object.entries(attachments).map(([key, val]) => ({ key, ...val }))
}

const normalizeStavke = (stavke) => {
    if (!stavke) return []
    if (Array.isArray(stavke)) return stavke
    return Object.values(stavke)
}

const parseSerbianDate = (dateStr) => {
    if (!dateStr) return ''
    const parts = dateStr.split('.')
    if (parts.length < 3) return ''
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

export const EmployeeTransactionDialog = ({
    isOpen,
    onClose,
    transaction,
    employeeKey,
    accounts,
    statements,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [direction, setDirection] = useState('to')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('RSD')
    const [date, setDate] = useState('')
    const [bankAccount, setBankAccount] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [pendingFiles, setPendingFiles] = useState([])
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)

    const isEdit = !!transaction

    useEffect(() => {
        if (transaction) {
            setDirection(transaction.direction || 'to')
            setDescription(transaction.description || '')
            setAmount(transaction.amount || '')
            setCurrency(transaction.currency || 'RSD')
            setDate(transaction.date || '')
            setBankAccount(transaction.bankAccount || '')
            setSelectedTransaction(
                transaction.transactionRef
                    ? {
                          id: transaction.transactionRef,
                          label: transaction.transactionLabel || '',
                      }
                    : null,
            )
        } else {
            setDirection('to')
            setDescription('')
            setAmount('')
            setCurrency('RSD')
            setDate(new Date().toISOString().slice(0, 10))
            setBankAccount('')
            setSelectedTransaction(null)
            setPendingFiles([])
        }
    }, [transaction, isOpen])

    const statementTransactions = useMemo(() => {
        if (!bankAccount) return []
        const accountStatements = statements.filter(
            (s) => s.partija === bankAccount,
        )
        const items = []
        accountStatements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                if (
                    (direction === 'to' && t.duguje > 0) ||
                    (direction === 'from' && t.potrazuje > 0)
                ) {
                    const txAmount =
                        direction === 'to' ? t.duguje : t.potrazuje
                    const id = `${s.key}::${i}`
                    const label = `${t.datumValute} | ${fmtNum(txAmount)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`
                    items.push({
                        id,
                        label,
                        amount: txAmount,
                        currency: s.valuta || 'RSD',
                        date: parseSerbianDate(t.datumValute),
                        description: t.nalogKorisnik || '',
                        opis: t.opis || '',
                        datumValute: t.datumValute,
                    })
                }
            })
        })
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        return items
    }, [bankAccount, direction, statements])

    const handleTransactionSelect = (_, value) => {
        setSelectedTransaction(value)
        if (value) {
            setAmount(value.amount)
            setCurrency(value.currency)
            setDate(value.date)
            setDescription(
                value.opis
                    ? `${value.description} - ${value.opis}`
                    : value.description,
            )
        }
    }

    const attachments = normalizeAttachments(transaction?.attachments)

    const handleSave = async () => {
        if (!amount || !date) {
            toast('Amount and date are required', { type: 'warning' })
            return
        }
        setSaving(true)
        try {
            const data = {
                employeeKey,
                direction,
                description,
                amount: parseFloat(amount),
                currency,
                date,
                bankAccount,
                transactionRef: selectedTransaction?.id || '',
                transactionLabel: selectedTransaction?.label || '',
            }
            if (isEdit) {
                await poslovanjService.updateEmployeeTransaction(
                    transaction.key,
                    data,
                )
                for (const file of pendingFiles) {
                    await poslovanjService.addEmployeeTransactionAttachment(
                        transaction.key,
                        file,
                    )
                }
            } else {
                const key =
                    await poslovanjService.createEmployeeTransaction(data)
                for (const file of pendingFiles) {
                    await poslovanjService.addEmployeeTransactionAttachment(
                        key,
                        file,
                    )
                }
            }
            toast(isEdit ? 'Transaction updated' : 'Transaction created', {
                type: 'success',
            })
            onClose()
        } catch (error) {
            toast('Failed to save transaction', { type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    const handleAddAttachment = () => {
        fileInputRef.current.value = ''
        fileInputRef.current.click()
    }

    const handleFileSelected = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (isEdit) {
            try {
                await poslovanjService.addEmployeeTransactionAttachment(
                    transaction.key,
                    file,
                )
                toast('Attachment added', { type: 'success' })
            } catch (error) {
                toast('Failed to add attachment', { type: 'error' })
            }
        } else {
            setPendingFiles((prev) => [...prev, file])
        }
    }

    const handleRemoveAttachment = async (attachmentKey) => {
        if (!confirm('Remove this attachment?')) return
        try {
            await poslovanjService.removeEmployeeTransactionAttachment(
                transaction.key,
                attachmentKey,
            )
            toast('Attachment removed', { type: 'success' })
        } catch (error) {
            toast('Failed to remove', { type: 'error' })
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            fullWidth
            fullScreen={isMobile}
            maxWidth="sm"
            PaperProps={{ sx: isMobile ? {} : { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                {isEdit ? 'Edit Transaction' : 'New Transaction'}
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
                    <InputLabel>Direction</InputLabel>
                    <Select
                        value={direction}
                        label="Direction"
                        onChange={(e) => {
                            setDirection(e.target.value)
                            setSelectedTransaction(null)
                        }}
                    >
                        <MenuItem value="to">To Employee (Payment)</MenuItem>
                        <MenuItem value="from">
                            From Employee (Repayment)
                        </MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Bank Account</InputLabel>
                    <Select
                        value={bankAccount}
                        label="Bank Account"
                        onChange={(e) => {
                            setBankAccount(e.target.value)
                            setSelectedTransaction(null)
                        }}
                    >
                        <MenuItem value="">None</MenuItem>
                        {accounts.map((acc) => (
                            <MenuItem key={acc.partija} value={acc.partija}>
                                {acc.partija} ({acc.valuta})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {bankAccount && (
                    <Autocomplete
                        options={statementTransactions}
                        value={selectedTransaction}
                        onChange={handleTransactionSelect}
                        getOptionLabel={(opt) => opt.label || ''}
                        isOptionEqualToValue={(opt, val) => opt.id === val.id}
                        renderOption={(props, opt) => (
                            <li {...props} key={opt.id}>
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="body2" noWrap>
                                        {opt.description}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        noWrap
                                    >
                                        {opt.datumValute} &middot;{' '}
                                        {fmtNum(opt.amount)} {opt.currency}
                                        {opt.opis ? ` · ${opt.opis}` : ''}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Statement Transaction"
                                size="small"
                                placeholder="Search transactions..."
                            />
                        )}
                        sx={{ mb: 2 }}
                        noOptionsText={`No ${direction === 'to' ? 'debit' : 'credit'} transactions found`}
                    />
                )}

                <TextField
                    label="Description"
                    fullWidth
                    size="small"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        mb: 2,
                    }}
                >
                    <TextField
                        label="Amount"
                        type="number"
                        size="small"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        sx={{ flex: 1 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Select
                                        variant="standard"
                                        value={currency}
                                        onChange={(e) =>
                                            setCurrency(e.target.value)
                                        }
                                        disableUnderline
                                        sx={{ fontSize: '0.85rem' }}
                                    >
                                        <MenuItem value="RSD">RSD</MenuItem>
                                        <MenuItem value="EUR">EUR</MenuItem>
                                        <MenuItem value="USD">USD</MenuItem>
                                    </Select>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Date"
                        type="date"
                        size="small"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ flex: 1 }}
                    />
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mt: 1,
                        mb: 0.5,
                    }}
                >
                    <InputLabel sx={{ fontSize: '0.85rem' }}>
                        Attachments
                    </InputLabel>
                    <Button
                        size="small"
                        startIcon={<AttachFile />}
                        onClick={handleAddAttachment}
                        sx={{ textTransform: 'none' }}
                    >
                        Add
                    </Button>
                </Box>
                {attachments.length === 0 && pendingFiles.length === 0 ? (
                    <Box
                        sx={{
                            py: 1,
                            textAlign: 'center',
                            color: 'text.secondary',
                            fontSize: '0.85rem',
                        }}
                    >
                        No attachments
                    </Box>
                ) : (
                    <List dense disablePadding>
                        {attachments.map((att) => (
                            <ListItem
                                key={att.key}
                                disableGutters
                                sx={{ py: 0.25 }}
                            >
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <InsertDriveFile
                                        fontSize="small"
                                        color="action"
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={att.name}
                                    primaryTypographyProps={{
                                        fontSize: '0.85rem',
                                        noWrap: true,
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        window.open(att.data, '_blank')
                                    }
                                    title="View"
                                >
                                    <OpenInNew fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        handleRemoveAttachment(att.key)
                                    }
                                    title="Remove"
                                    sx={{ color: '#d32f2f' }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </ListItem>
                        ))}
                        {pendingFiles.map((file, i) => (
                            <ListItem
                                key={`pending-${i}`}
                                disableGutters
                                sx={{ py: 0.25 }}
                            >
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                    <InsertDriveFile
                                        fontSize="small"
                                        color="action"
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary={file.name}
                                    primaryTypographyProps={{
                                        fontSize: '0.85rem',
                                        noWrap: true,
                                    }}
                                />
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        setPendingFiles((prev) =>
                                            prev.filter((_, j) => j !== i),
                                        )
                                    }
                                    title="Remove"
                                    sx={{ color: '#d32f2f' }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ textTransform: 'none' }}
                >
                    {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
