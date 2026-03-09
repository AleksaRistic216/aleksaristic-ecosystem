import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Autocomplete,
    Box,
    Button,
    Chip,
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
    LinkOff,
    OpenInNew,
} from '@mui/icons-material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'

const PAYMENT_METHODS = [
    { value: 'bank_account', label: 'Bank Account' },
    { value: 'card', label: 'Card (linked to account)' },
    { value: 'cash', label: 'Cash' },
]

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

export const ExpenseDialog = ({
    isOpen,
    onClose,
    expense,
    accounts,
    statements,
    partners,
    defaultPartnerKey,
    allExpenses = [],
    defaultTransaction,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('RSD')
    const [date, setDate] = useState('')
    const [status, setStatus] = useState('paid')
    const [partnerKey, setPartnerKey] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('bank_account')
    const [bankAccount, setBankAccount] = useState('')
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [pendingFiles, setPendingFiles] = useState([])
    const [saving, setSaving] = useState(false)
    const fileInputRef = useRef(null)

    const isEdit = !!expense
    const partnerList = partners || []

    useEffect(() => {
        if (expense) {
            setDescription(expense.description || '')
            setAmount(expense.amount || '')
            setCurrency(expense.currency || 'RSD')
            setDate(expense.date || '')
            setStatus(expense.status || 'paid')
            setPartnerKey(expense.partnerKey || '')
            setPaymentMethod(expense.paymentMethod || 'bank_account')
            setBankAccount(expense.bankAccount || '')
            // Read linked refs — old single-ref format only
            const hasMultiRefs = expense.transactionRefs && typeof expense.transactionRefs === 'object'
            if (hasMultiRefs) {
                // Multi-refs are shown as a list, not in the Autocomplete
                setSelectedTransaction(null)
                const firstData = Object.values(expense.transactionRefs)[0]
                if (firstData?.bankAccount) setBankAccount(firstData.bankAccount)
            } else if (expense.transactionRef) {
                setSelectedTransaction({ id: expense.transactionRef, label: expense.transactionLabel || '' })
            } else {
                setSelectedTransaction(null)
            }
        } else if (defaultTransaction) {
            const tx = defaultTransaction
            const txId = `${tx.statementKey}::${tx.index}`
            const desc = tx.opis
                ? `${tx.nalogKorisnik} - ${tx.opis}`
                : tx.nalogKorisnik
            const label = `${tx.datumValute} | ${fmtNum(tx.amount)} ${tx.currency} | ${tx.nalogKorisnik}${tx.opis ? ' - ' + tx.opis : ''}`
            setDescription(desc)
            setAmount(tx.amount)
            setCurrency(tx.currency)
            setDate(parseSerbianDate(tx.datumValute))
            setStatus('paid')
            setPartnerKey(defaultPartnerKey || '')
            setPaymentMethod('bank_account')
            setBankAccount(tx.partija)
            setSelectedTransaction({ id: txId, label })
            setPendingFiles([])
        } else {
            setDescription('')
            setAmount('')
            setCurrency('RSD')
            setDate(new Date().toISOString().slice(0, 10))
            setStatus('unpaid')
            setPartnerKey(defaultPartnerKey || '')
            setPaymentMethod('bank_account')
            setBankAccount('')
            setSelectedTransaction(null)
            setPendingFiles([])
        }
    }, [expense, isOpen, defaultPartnerKey, defaultTransaction])

    const linkedRefs = useMemo(() => {
        if (!expense?.transactionRefs || typeof expense.transactionRefs !== 'object') return []
        return Object.entries(expense.transactionRefs).map(([txRef, data]) => {
            const [stmtKey, idxStr] = txRef.split('::')
            const stmt = statements.find((s) => s.key === stmtKey)
            let label = data.label || txRef
            if (stmt) {
                const stavke = normalizeStavke(stmt.stavke)
                const stavka = stavke[Number(idxStr)]
                if (stavka) {
                    label = `${stavka.datumValute} | ${stavka.nalogKorisnik || ''}${stavka.opis ? ' - ' + stavka.opis : ''}`
                }
            }
            return { ref: txRef, amount: data.amount || 0, bankAccount: data.bankAccount || '', label }
        })
    }, [expense, statements])

    const consumedByRef = useMemo(() => {
        const map = {}
        allExpenses.forEach((e) => {
            if (expense && e.key === expense.key) return
            if (e.transactionRefs && typeof e.transactionRefs === 'object') {
                Object.entries(e.transactionRefs).forEach(([r, data]) => {
                    map[r] = (map[r] || 0) + (data.amount || 0)
                })
            } else if (e.transactionRef) {
                map[e.transactionRef] =
                    (map[e.transactionRef] || 0) + (e.amount || 0)
            }
        })
        return map
    }, [allExpenses, expense])

    const transactions = useMemo(() => {
        if (!bankAccount || paymentMethod === 'cash' || status === 'unpaid')
            return []
        const accountStatements = statements.filter(
            (s) => s.partija === bankAccount,
        )
        const items = []
        accountStatements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                if (t.duguje > 0) {
                    const id = `${s.key}::${i}`
                    const consumed = consumedByRef[id] || 0
                    const available = t.duguje - consumed
                    if (available <= 0) return
                    const label = `${t.datumValute} | ${fmtNum(available)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`
                    items.push({
                        id,
                        label,
                        statementKey: s.key,
                        index: i,
                        amount: available,
                        originalAmount: t.duguje,
                        currency: s.valuta || 'RSD',
                        date: parseSerbianDate(t.datumValute),
                        description: t.nalogKorisnik || '',
                        opis: t.opis || '',
                        datumValute: t.datumValute,
                        isPartial: consumed > 0,
                    })
                }
            })
        })
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        return items
    }, [bankAccount, paymentMethod, statements, status, consumedByRef])

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

    const handleUnlinkRef = async (txRef) => {
        if (!confirm('Remove this bank statement link?')) return
        try {
            await poslovanjService.removeExpenseTransactionRef(expense.key, txRef)
            toast('Link removed', { type: 'success' })
        } catch (error) {
            toast('Failed to remove link', { type: 'error' })
        }
    }

    const attachments = normalizeAttachments(expense?.attachments)

    const handleSave = async () => {
        if (!amount || !date) {
            toast('Amount and date are required', { type: 'warning' })
            return
        }
        setSaving(true)
        try {
            const data = {
                description,
                amount: parseFloat(amount),
                currency,
                date,
                status,
                partnerKey,
            }
            const hasMultiRefs = expense?.transactionRefs && typeof expense.transactionRefs === 'object'
            console.log('[ExpenseDialog.handleSave] hasMultiRefs:', hasMultiRefs, 'selectedTransaction:', selectedTransaction, 'linkedRefs:', linkedRefs.length, 'status:', status)
            if (status !== 'unpaid') {
                data.paymentMethod = paymentMethod
                data.bankAccount =
                    paymentMethod === 'cash' ? '' : bankAccount
                if (hasMultiRefs && !selectedTransaction) {
                    // User cleared the link — remove all refs
                    data.transactionRefs = null
                    data.transactionRef = ''
                    data.transactionLabel = ''
                    console.log('[ExpenseDialog.handleSave] CLEARING all refs (hasMultiRefs && !selectedTransaction)')
                } else if (!hasMultiRefs) {
                    data.transactionRef = selectedTransaction?.id || ''
                    data.transactionLabel = selectedTransaction?.label || ''
                    console.log('[ExpenseDialog.handleSave] setting single ref:', data.transactionRef)
                }
            } else {
                data.paymentMethod = ''
                data.bankAccount = ''
                if (!hasMultiRefs) {
                    data.transactionRef = ''
                    data.transactionLabel = ''
                } else {
                    // Clear multi-refs when setting to unpaid
                    data.transactionRefs = null
                }
            }
            console.log('[ExpenseDialog.handleSave] final data:', JSON.stringify(data))
            if (isEdit) {
                await poslovanjService.updateExpense(expense.key, data)
                for (const file of pendingFiles) {
                    await poslovanjService.addExpenseAttachment(
                        expense.key,
                        file,
                    )
                }
            } else {
                const key = await poslovanjService.createExpense(data)
                for (const file of pendingFiles) {
                    await poslovanjService.addExpenseAttachment(key, file)
                }
            }
            toast(isEdit ? 'Expense updated' : 'Expense created', {
                type: 'success',
            })
            onClose()
        } catch (error) {
            toast('Failed to save expense', { type: 'error' })
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
                await poslovanjService.addExpenseAttachment(expense.key, file)
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
            await poslovanjService.removeExpenseAttachment(
                expense.key,
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
                {isEdit ? 'Edit Expense' : 'New Expense'}
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    label="Description"
                    fullWidth
                    size="small"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ mb: 2, mt: 1 }}
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

                {partnerList.length > 0 && (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel>Partner</InputLabel>
                        <Select
                            value={partnerKey}
                            label="Partner"
                            onChange={(e) => setPartnerKey(e.target.value)}
                        >
                            <MenuItem value="">None</MenuItem>
                            {partnerList.map((p) => (
                                <MenuItem key={p.key} value={p.key}>
                                    {p.name}
                                    {p.taxId ? ` (${p.taxId})` : ''}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Payment Status</InputLabel>
                    <Select
                        value={status}
                        label="Payment Status"
                        onChange={(e) => {
                            setStatus(e.target.value)
                            if (e.target.value === 'unpaid') {
                                setSelectedTransaction(null)
                            }
                        }}
                    >
                        <MenuItem value="unpaid">Unpaid</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                    </Select>
                </FormControl>

                {status !== 'unpaid' && (
                    <>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>Payment Method</InputLabel>
                            <Select
                                value={paymentMethod}
                                label="Payment Method"
                                onChange={(e) => {
                                    setPaymentMethod(e.target.value)
                                    setSelectedTransaction(null)
                                }}
                            >
                                {PAYMENT_METHODS.map((m) => (
                                    <MenuItem key={m.value} value={m.value}>
                                        {m.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {paymentMethod !== 'cash' && (
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
                                    {accounts.map((acc) => (
                                        <MenuItem
                                            key={acc.partija}
                                            value={acc.partija}
                                        >
                                            {acc.partija} ({acc.valuta})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {paymentMethod !== 'cash' && bankAccount && (
                            <>
                                {linkedRefs.length > 0 && (
                                    <Box sx={{ mb: 1.5 }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                            Linked Transactions ({linkedRefs.length})
                                        </Typography>
                                        {linkedRefs.map((lr) => (
                                            <Box
                                                key={lr.ref}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    py: 0.5,
                                                    px: 1,
                                                    mb: 0.5,
                                                    bgcolor: 'grey.50',
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                }}
                                            >
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" noWrap>
                                                        {lr.label}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {fmtNum(lr.amount)} {currency || 'RSD'}
                                                    </Typography>
                                                </Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleUnlinkRef(lr.ref)}
                                                    title="Unlink"
                                                    sx={{ color: '#d32f2f' }}
                                                >
                                                    <LinkOff fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                {linkedRefs.length === 0 && (
                                    <Autocomplete
                                        options={transactions}
                                        value={selectedTransaction}
                                        onChange={handleTransactionSelect}
                                        getOptionLabel={(opt) => opt.label || ''}
                                        isOptionEqualToValue={(opt, val) =>
                                            opt.id === val.id
                                        }
                                        renderOption={(props, opt) => (
                                            <li {...props} key={opt.id}>
                                                <Box sx={{ width: '100%' }}>
                                                    <Typography
                                                        variant="body2"
                                                        noWrap
                                                    >
                                                        {opt.description}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        noWrap
                                                    >
                                                        {opt.datumValute} &middot;{' '}
                                                        {fmtNum(opt.amount)}{' '}
                                                        {opt.currency}
                                                        {opt.isPartial
                                                            ? ` (of ${fmtNum(opt.originalAmount)})`
                                                            : ''}
                                                        {opt.opis
                                                            ? ` · ${opt.opis}`
                                                            : ''}
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
                                        noOptionsText="No debit transactions found"
                                    />
                                )}
                            </>
                        )}
                    </>
                )}

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
