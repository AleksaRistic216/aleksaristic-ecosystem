import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Chip,
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
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import {
    Add,
    ArrowBack,
    AttachFile,
    Close,
    ContentCopy,
    Delete,
    Edit,
    SyncAlt,
} from '@mui/icons-material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { EmployeeTransactionDialog } from './EmployeeTransactionDialog'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const normalizeAttachments = (attachments) => {
    if (!attachments) return []
    if (Array.isArray(attachments)) return attachments
    return Object.values(attachments)
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

const normalizeAccount = (acc) => {
    if (!acc) return ''
    return acc.replace(/\D/g, '')
}

const getLinkedRefs = (item) => {
    if (item.transactionRefs && typeof item.transactionRefs === 'object') {
        return Object.entries(item.transactionRefs).map(([r, data]) => ({
            ref: r,
            amount: data.amount || 0,
            label: data.label || '',
            bankAccount: data.bankAccount || '',
        }))
    }
    if (item.transactionRef) {
        return [{
            ref: item.transactionRef,
            amount: item.amount || 0,
            label: item.transactionLabel || '',
            bankAccount: item.bankAccount || '',
        }]
    }
    return []
}

const getTotalLinked = (item) =>
    getLinkedRefs(item).reduce((sum, r) => sum + r.amount, 0)

const isFullyLinked = (item) =>
    getTotalLinked(item) >= (item.amount || 0) - 0.01

const getPartnerAccounts = (partner) => {
    if (!partner) return []
    if (partner.bankAccounts && Array.isArray(partner.bankAccounts)) {
        return partner.bankAccounts
    }
    if (partner.bankAccount) {
        return [{ account: partner.bankAccount, primary: true }]
    }
    return []
}

export const EmployeeDetail = ({
    employee,
    partner,
    transactions,
    allExpenses = [],
    statements,
    accounts,
    transactionPartners = [],
    onBack,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTransaction, setEditTransaction] = useState(null)

    const sorted = useMemo(() => {
        return [...transactions].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [transactions])

    const handleDelete = async (tx) => {
        if (!confirm('Delete this transaction?')) return
        try {
            await poslovanjService.deleteEmployeeTransaction(tx.key)
            toast('Transaction deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleNew = () => {
        setEditTransaction(null)
        setDialogOpen(true)
    }

    const handleEdit = (tx) => {
        setEditTransaction(tx)
        setDialogOpen(true)
    }

    const handleClone = async (tx) => {
        const { key, createdAt, updatedAt, attachments, ...data } = tx
        try {
            await poslovanjService.createEmployeeTransaction({
                ...data,
                transactionRef: '',
                transactionLabel: '',
            })
            toast('Transaction cloned', { type: 'success' })
        } catch (error) {
            toast('Failed to clone', { type: 'error' })
        }
    }

    const [itemLinkOpen, setItemLinkOpen] = useState(false)
    const [itemLinkTxns, setItemLinkTxns] = useState([])
    const [itemLinkTx, setItemLinkTx] = useState(null)

    const partnerMappedRefs = useMemo(() => {
        const map = new Map()
        transactionPartners.forEach((tp) => {
            if (tp.transactionRef) map.set(tp.transactionRef, tp.key)
        })
        return map
    }, [transactionPartners])

    const handleAutoLinkItem = (tx) => {
        const itemRemaining = (tx.amount || 0) - getTotalLinked(tx)
        if (itemRemaining <= 0.01) {
            toast('Transaction is already fully linked', { type: 'info' })
            return
        }
        const empAccounts = getPartnerAccounts(partner)
        const normalizedEmpAccounts = empAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)

        if (normalizedEmpAccounts.length === 0 && partnerMappedRefs.size === 0) {
            toast('Partner has no bank accounts', { type: 'warning' })
            return
        }

        const consumedByRef = {}
        const addItem = (item) => {
            getLinkedRefs(item).forEach(({ ref, amount }) => {
                consumedByRef[ref] = (consumedByRef[ref] || 0) + amount
            })
        }
        transactions.forEach(addItem)
        allExpenses.forEach(addItem)

        const matchesEmp = (txAccount) =>
            normalizedEmpAccounts.some(
                (emp) => txAccount.includes(emp) || emp.includes(txAccount),
            )

        const candidates = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const txRef = `${s.key}::${i}`
                const isMapped = partnerMappedRefs.has(txRef)
                if (!isMapped) {
                    const txAccount = normalizeAccount(t.brojRacuna)
                    if (!txAccount || !matchesEmp(txAccount)) return
                }
                const isDuguje = t.duguje > 0
                const isPotrazuje = t.potrazuje > 0
                if (!isDuguje && !isPotrazuje) return
                const direction = isDuguje ? 'to' : 'from'
                if (direction !== tx.direction) return
                const amount = isDuguje ? t.duguje : t.potrazuje
                const consumed = consumedByRef[txRef] || 0
                const available = amount - consumed
                if (available <= 0.01) return
                candidates.push({
                    ref: txRef,
                    direction,
                    amount,
                    available,
                    currency: s.valuta || 'RSD',
                    date: t.datumValute,
                    bankAccount: s.partija,
                    description: t.nalogKorisnik || '',
                    opis: t.opis || '',
                    label: `${t.datumValute} | ${fmtNum(amount)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`,
                    partnerMappingKey: partnerMappedRefs.get(txRef) || null,
                })
            })
        })

        if (candidates.length === 0) {
            toast('No matching bank transaction found', { type: 'info' })
            return
        }

        if (candidates.length === 1) {
            handleItemLinkConfirm(tx, candidates[0])
            return
        }

        setItemLinkTx(tx)
        setItemLinkTxns(candidates)
        setItemLinkOpen(true)
    }

    const handleItemLinkConfirm = async (tx, bankEntry) => {

        try {
            const totalLinked = getTotalLinked(tx)
            const itemRemaining = (tx.amount || 0) - totalLinked
            const allocated = Math.min(itemRemaining, bankEntry.available)
            console.log('[handleItemLinkConfirm] tx.key:', tx.key, 'bankEntry.ref:', bankEntry.ref, 'totalLinked:', totalLinked, 'itemRemaining:', itemRemaining, 'allocated:', allocated, 'bankEntry.available:', bankEntry.available, 'bankEntry.bankAccount:', bankEntry.bankAccount)

            if (bankEntry.partnerMappingKey) {
                const newMappedRemaining = bankEntry.available - allocated
                if (newMappedRemaining < 0.01) {
                    await poslovanjService.unlinkTransactionFromPartner(
                        bankEntry.partnerMappingKey,
                    )
                }
            }
            await poslovanjService.addEmployeeTransactionRef(
                tx.key,
                bankEntry.ref,
                {
                    amount: allocated,
                    label: bankEntry.label,
                    bankAccount: bankEntry.bankAccount,
                },
            )
            toast('Transaction linked', { type: 'success' })
            setItemLinkOpen(false)
        } catch (err) {
            toast(err.message || 'Failed to link transaction', { type: 'error' })
        }
    }

    return (
        <Grid
            container
            justifyContent="center"
            py={isMobile ? 2 : 4}
            px={isMobile ? 1 : 2}
        >
            <Grid item xs={12} md={10} lg={8}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <IconButton onClick={onBack} size="small">
                            <ArrowBack />
                        </IconButton>
                        <Box>
                            <Typography
                                variant={isMobile ? 'h6' : 'h5'}
                                fontWeight={600}
                            >
                                {employee.name}
                            </Typography>
                            {employee.position && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {employee.position}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleNew}
                            size={isMobile ? 'small' : 'medium'}
                            sx={{ textTransform: 'none' }}
                        >
                            {isMobile ? 'New' : 'New Transaction'}
                        </Button>
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        gap: isMobile ? 1 : 2,
                        mb: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    {partner && (
                        <Chip
                            label={partner.name}
                            size="small"
                            variant="outlined"
                            color="primary"
                        />
                    )}
                    {getPartnerAccounts(partner).map((acc, i) => (
                        <Chip
                            key={i}
                            label={acc.account}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                        />
                    ))}
                    {partner?.email && (
                        <Chip
                            label={partner.email}
                            size="small"
                            variant="outlined"
                        />
                    )}
                    {partner?.phone && (
                        <Chip
                            label={partner.phone}
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Box>

                {isMobile ? (
                    <>
                        {sorted.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No transactions yet
                            </Paper>
                        )}
                        {sorted.map((tx) => (
                            <Paper
                                key={tx.key}
                                variant="outlined"
                                sx={{ mb: 1.5, p: 2 }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        mb: 0.5,
                                    }}
                                >
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            noWrap
                                        >
                                            {tx.description || '—'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {tx.date}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            ml: 1,
                                            color:
                                                tx.direction === 'to'
                                                    ? '#d32f2f'
                                                    : '#2e7d32',
                                        }}
                                    >
                                        {tx.direction === 'to' ? '-' : '+'}
                                        {fmtNum(tx.amount)}{' '}
                                        {tx.currency || 'RSD'}
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mt: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Chip
                                            label={
                                                tx.direction === 'to'
                                                    ? 'Payment'
                                                    : 'Repayment'
                                            }
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor:
                                                    tx.direction === 'to'
                                                        ? '#d32f2f'
                                                        : '#2e7d32',
                                                color:
                                                    tx.direction === 'to'
                                                        ? '#d32f2f'
                                                        : '#2e7d32',
                                            }}
                                        />
                                        {!isFullyLinked(tx) && (
                                            <Chip
                                                label="Unlinked"
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor: '#ed6c02',
                                                    color: '#ed6c02',
                                                }}
                                            />
                                        )}
                                        {normalizeAttachments(tx.attachments)
                                            .length > 0 && (
                                            <AttachFile
                                                sx={{
                                                    fontSize: 16,
                                                    color: '#2e7d32',
                                                }}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        {!isFullyLinked(tx) && (
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleAutoLinkItem(tx)
                                                }
                                                title="Auto link"
                                            >
                                                <SyncAlt fontSize="small" />
                                            </IconButton>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(tx)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleClone(tx)}
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(tx)}
                                            sx={{ color: '#d32f2f' }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell>
                                        <strong>Date</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Description</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Direction</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Amount</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Actions</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sorted.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            No transactions yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sorted.map((tx) => (
                                    <TableRow key={tx.key} hover>
                                        <TableCell>{tx.date}</TableCell>
                                        <TableCell>
                                            {tx.description || '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 0.5,
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Chip
                                                    label={
                                                        tx.direction === 'to'
                                                            ? 'Payment'
                                                            : 'Repayment'
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor:
                                                            tx.direction ===
                                                            'to'
                                                                ? '#d32f2f'
                                                                : '#2e7d32',
                                                        color:
                                                            tx.direction ===
                                                            'to'
                                                                ? '#d32f2f'
                                                                : '#2e7d32',
                                                    }}
                                                />
                                                {!isFullyLinked(tx) && (
                                                    <Chip
                                                        label="Unlinked"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{
                                                            borderColor:
                                                                '#ed6c02',
                                                            color: '#ed6c02',
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 600,
                                                color:
                                                    tx.direction === 'to'
                                                        ? '#d32f2f'
                                                        : '#2e7d32',
                                            }}
                                        >
                                            {tx.direction === 'to' ? '-' : '+'}
                                            {fmtNum(tx.amount)}{' '}
                                            {tx.currency || 'RSD'}
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ whiteSpace: 'nowrap' }}
                                        >
                                            {normalizeAttachments(
                                                tx.attachments,
                                            ).length > 0 && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        const atts =
                                                            normalizeAttachments(
                                                                tx.attachments,
                                                            )
                                                        window.open(
                                                            atts[0].data,
                                                            '_blank',
                                                        )
                                                    }}
                                                    title="View attachment"
                                                    sx={{ color: '#2e7d32' }}
                                                >
                                                    <AttachFile fontSize="small" />
                                                </IconButton>
                                            )}
                                            {!isFullyLinked(tx) && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleAutoLinkItem(tx)
                                                    }
                                                    title="Auto link"
                                                >
                                                    <SyncAlt fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(tx)}
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleClone(tx)}
                                                title="Clone"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(tx)}
                                                title="Delete"
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
                )}
            </Grid>

            <EmployeeTransactionDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                transaction={editTransaction}
                employeeKey={employee.key}
                accounts={accounts}
                statements={statements}
            />

            <Dialog
                open={itemLinkOpen}
                onClose={() => setItemLinkOpen(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={600}>
                            Select Transaction
                        </Typography>
                        {itemLinkTx && (() => {
                            const remaining = (itemLinkTx.amount || 0) - getTotalLinked(itemLinkTx)
                            const cur = itemLinkTx.currency || 'RSD'
                            return (
                                <Typography variant="body2" color="text.secondary">
                                    {itemLinkTx.description || '—'} &mdash;{' '}
                                    {remaining < (itemLinkTx.amount || 0) - 0.01
                                        ? <><strong>{fmtNum(remaining)}</strong> remaining of {fmtNum(itemLinkTx.amount)} {cur}</>
                                        : <>{fmtNum(itemLinkTx.amount)} {cur}</>
                                    }
                                </Typography>
                            )
                        })()}
                    </Box>
                    <IconButton
                        onClick={() => setItemLinkOpen(false)}
                        size="small"
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>
                                    <strong>Date</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Description</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Amount</strong>
                                </TableCell>
                                <TableCell align="center">
                                    <strong>Action</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {itemLinkTxns.map((tx) => (
                                <TableRow key={tx.ref} hover>
                                    <TableCell>{tx.date}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {tx.description}
                                        </Typography>
                                        {tx.opis && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {tx.opis}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {Math.abs(tx.available - tx.amount) > 0.01 ? (
                                            <>
                                                {fmtNum(tx.available)}{' '}
                                                <Typography
                                                    component="span"
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ fontWeight: 400 }}
                                                >
                                                    of {fmtNum(tx.amount)}
                                                </Typography>
                                            </>
                                        ) : (
                                            fmtNum(tx.amount)
                                        )}{' '}
                                        {tx.currency}
                                    </TableCell>
                                    <TableCell align="center">
                                        {(() => {
                                            const remaining = itemLinkTx
                                                ? (itemLinkTx.amount || 0) - getTotalLinked(itemLinkTx)
                                                : 0
                                            const allocated = Math.min(remaining, tx.available)
                                            if (remaining <= 0.01) return null
                                            if (tx.available < remaining - 0.01) {
                                                return (
                                                    <Chip
                                                        label={`covers ${fmtNum(allocated)} of ${fmtNum(remaining)}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mb: 0.5, color: '#e65100', borderColor: '#e65100' }}
                                                    />
                                                )
                                            }
                                            if (tx.available > remaining + 0.01) {
                                                return (
                                                    <Chip
                                                        label={`will allocate ${fmtNum(allocated)}`}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mb: 0.5, color: '#1565c0', borderColor: '#1565c0' }}
                                                    />
                                                )
                                            }
                                            return null
                                        })()}
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() =>
                                                handleItemLinkConfirm(
                                                    itemLinkTx,
                                                    tx,
                                                )
                                            }
                                            sx={{ textTransform: 'none' }}
                                        >
                                            Link
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </Grid>
    )
}
