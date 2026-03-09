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
    LinkOff,
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
            const hasMultiRefs = transaction.transactionRefs && typeof transaction.transactionRefs === 'object'
            if (hasMultiRefs) {
                setSelectedTransaction(null)
                const firstData = Object.values(transaction.transactionRefs)[0]
                if (firstData?.bankAccount) setBankAccount(firstData.bankAccount)
            } else if (transaction.transactionRef) {
                setSelectedTransaction({ id: transaction.transactionRef, label: transaction.transactionLabel || '' })
            } else {
                setSelectedTransaction(null)
            }
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

    const linkedRefs = useMemo(() => {
        if (!transaction?.transactionRefs || typeof transaction.transactionRefs !== 'object') return []
        return Object.entries(transaction.transactionRefs).map(([txRef, data]) => {
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
    }, [transaction, statements])

    const handleUnlinkRef = async (txRef) => {
        if (!confirm('Remove this bank statement link?')) return
        try {
            await poslovanjService.removeEmployeeTransactionRef(transaction.key, txRef)
            toast('Link removed', { type: 'success' })
        } catch (error) {
            toast('Failed to remove link', { type: 'error' })
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
            const hasMultiRefs = transaction?.transactionRefs && typeof transaction.transactionRefs === 'object'
            const data = {
                employeeKey,
                direction,
                description,
                amount: parseFloat(amount),
                currency,
                date,
                bankAccount,
            }
            console.log('[EmpTxDialog.handleSave] hasMultiRefs:', hasMultiRefs, 'selectedTransaction:', selectedTransaction, 'linkedRefs:', linkedRefs.length)
            if (hasMultiRefs && !selectedTransaction) {
                // User cleared the link — remove all refs
                data.transactionRefs = null
                data.transactionRef = ''
                data.transactionLabel = ''
                console.log('[EmpTxDialog.handleSave] CLEARING all refs (hasMultiRefs && !selectedTransaction)')
            } else if (!hasMultiRefs) {
                data.transactionRef = selectedTransaction?.id || ''
                data.transactionLabel = selectedTransaction?.label || ''
                console.log('[EmpTxDialog.handleSave] setting single ref:', data.transactionRef)
            }
            console.log('[EmpTxDialog.handleSave] final data:', JSON.stringify(data))
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
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1.5,
                        mb: 2,
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 1, display: 'block' }}
                    >
                        Bank Statement Link (optional)
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: bankAccount ? 1.5 : 0 }}>
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
                                    options={statementTransactions}
                                    value={selectedTransaction}
                                    onChange={handleTransactionSelect}
                                    getOptionLabel={(opt) => opt.label || ''}
                                    isOptionEqualToValue={(opt, val) =>
                                        opt.id === val.id
                                    }
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
                                    noOptionsText={`No ${direction === 'to' ? 'debit' : 'credit'} transactions found`}
                                />
                            )}
                        </>
                    )}
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
