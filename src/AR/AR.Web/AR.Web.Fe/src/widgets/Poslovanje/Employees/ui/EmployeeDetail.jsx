import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    LinearProgress,
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
    SearchRounded,
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
    statements,
    accounts,
    transactionPartners = [],
    onBack,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editTransaction, setEditTransaction] = useState(null)
    const [discoverOpen, setDiscoverOpen] = useState(false)
    const [discovered, setDiscovered] = useState([])
    const [discoverSelected, setDiscoverSelected] = useState(new Set())
    const [discovering, setDiscovering] = useState(false)

    const sorted = useMemo(() => {
        return [...transactions].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [transactions])

    const totals = useMemo(() => {
        let toEmployee = 0
        let fromEmployee = 0
        transactions.forEach((t) => {
            if (t.direction === 'to') toEmployee += t.amount || 0
            else fromEmployee += t.amount || 0
        })
        return { toEmployee, fromEmployee, balance: toEmployee - fromEmployee }
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

    const handleDiscover = () => {
        const empAccounts = getPartnerAccounts(partner)
        if (empAccounts.length === 0) {
            toast('Partner has no bank accounts set', { type: 'warning' })
            return
        }

        const linkedRefs = new Set(
            transactions.filter((t) => t.transactionRef).map((t) => t.transactionRef),
        )

        const normalizedEmpAccounts = empAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)
        const found = []
        const seenAccounts = new Set()

        const matchesEmployee = (txAccount) => {
            return normalizedEmpAccounts.some(
                (emp) => txAccount.includes(emp) || emp.includes(txAccount),
            )
        }

        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const txAccount = normalizeAccount(t.brojRacuna)
                if (txAccount) seenAccounts.add(t.brojRacuna)
                if (!txAccount) return
                if (!matchesEmployee(txAccount)) return

                const ref = `${s.key}::${i}`
                if (linkedRefs.has(ref)) return

                const isDuguje = t.duguje > 0
                const isPotrazuje = t.potrazuje > 0
                if (!isDuguje && !isPotrazuje) return

                found.push({
                    ref,
                    direction: isDuguje ? 'to' : 'from',
                    amount: isDuguje ? t.duguje : t.potrazuje,
                    currency: s.valuta || 'RSD',
                    date: parseSerbianDate(t.datumValute),
                    datumValute: t.datumValute,
                    description: t.opis
                        ? `${t.nalogKorisnik || ''} - ${t.opis}`
                        : t.nalogKorisnik || '',
                    bankAccount: s.partija,
                    label: `${t.datumValute} | ${fmtNum(isDuguje ? t.duguje : t.potrazuje)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`,
                })
            })
        })

        found.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

        if (found.length === 0) {
            console.log('Discover: employee accounts =', empAccounts.map((a) => a.account), '→', normalizedEmpAccounts)
            console.log('Discover: statement accounts seen =', [...seenAccounts])
            toast('No new transactions found for these accounts', { type: 'info' })
            return
        }

        setDiscovered(found)
        setDiscoverSelected(new Set(found.map((f) => f.ref)))
        setDiscoverOpen(true)
    }

    const handleDiscoverToggle = (ref) => {
        setDiscoverSelected((prev) => {
            const next = new Set(prev)
            if (next.has(ref)) next.delete(ref)
            else next.add(ref)
            return next
        })
    }

    const handleDiscoverToggleAll = () => {
        if (discoverSelected.size === discovered.length) {
            setDiscoverSelected(new Set())
        } else {
            setDiscoverSelected(new Set(discovered.map((f) => f.ref)))
        }
    }

    const [balanceOpen, setBalanceOpen] = useState(false)
    const [balanceMatches, setBalanceMatches] = useState([])
    const [balanceSelected, setBalanceSelected] = useState(new Set())
    const [balancingTx, setBalancingTx] = useState(false)

    const handleAutoBalance = () => {
        const empAccounts = getPartnerAccounts(partner)
        const normalizedEmpAccounts = empAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)

        if (normalizedEmpAccounts.length === 0 && partnerMappedRefs.size === 0) {
            toast('Partner has no bank accounts set', { type: 'warning' })
            return
        }

        const unlinked = transactions.filter((t) => !t.transactionRef)
        if (unlinked.length === 0) {
            toast('No unlinked transactions to balance', { type: 'info' })
            return
        }

        const consumedByRef = {}
        transactions.forEach((t) => {
            if (t.transactionRef) {
                consumedByRef[t.transactionRef] =
                    (consumedByRef[t.transactionRef] || 0) + (t.amount || 0)
            }
        })

        const matchesEmp = (txAccount) =>
            normalizedEmpAccounts.some(
                (emp) => txAccount.includes(emp) || emp.includes(txAccount),
            )

        // Build available bank statement entries
        const bankEntries = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const ref = `${s.key}::${i}`
                const isMapped = partnerMappedRefs.has(ref)
                if (!isMapped) {
                    const txAccount = normalizeAccount(t.brojRacuna)
                    if (!txAccount || !matchesEmp(txAccount)) return
                }
                const isDuguje = t.duguje > 0
                const isPotrazuje = t.potrazuje > 0
                if (!isDuguje && !isPotrazuje) return
                const amount = isDuguje ? t.duguje : t.potrazuje
                const consumed = consumedByRef[ref] || 0
                const available = amount - consumed
                if (available <= 0.01) return
                bankEntries.push({
                    ref,
                    direction: isDuguje ? 'to' : 'from',
                    amount,
                    available,
                    currency: s.valuta || 'RSD',
                    date: parseSerbianDate(t.datumValute),
                    datumValute: t.datumValute,
                    description: t.nalogKorisnik || '',
                    opis: t.opis || '',
                    bankAccount: s.partija,
                    label: `${t.datumValute} | ${fmtNum(amount)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`,
                    partnerMappingKey: partnerMappedRefs.get(ref) || null,
                })
            })
        })

        if (bankEntries.length === 0) {
            toast('No unlinked bank entries for this employee', {
                type: 'info',
            })
            return
        }

        // Match unlinked transactions to bank entries by amount + direction
        const usedRefs = new Set()
        const matches = []

        unlinked.forEach((tx) => {
            const match = bankEntries.find(
                (be) =>
                    !usedRefs.has(be.ref) &&
                    be.direction === tx.direction &&
                    Math.abs(be.amount - (tx.amount || 0)) < 0.01,
            )
            if (match) {
                usedRefs.add(match.ref)
                matches.push({ transaction: tx, bankEntry: match })
            }
        })

        if (matches.length === 0) {
            toast('Could not match any transactions to bank entries', {
                type: 'info',
            })
            return
        }

        setBalanceMatches(matches)
        setBalanceSelected(new Set(matches.map((_, i) => i)))
        setBalanceOpen(true)
    }

    const handleBalanceToggle = (index) => {
        setBalanceSelected((prev) => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    const handleBalanceConfirm = async () => {
        const selected = balanceMatches.filter((_, i) =>
            balanceSelected.has(i),
        )
        if (selected.length === 0) return

        setBalancingTx(true)
        try {
            let count = 0
            for (const match of selected) {
                if (match.bankEntry.partnerMappingKey) {
                    const newRemaining =
                        (match.bankEntry.available || match.bankEntry.amount) -
                        (match.transaction.amount || 0)
                    if (newRemaining < 0.01) {
                        await poslovanjService.unlinkTransactionFromPartner(
                            match.bankEntry.partnerMappingKey,
                        )
                    }
                }
                await poslovanjService.updateEmployeeTransaction(
                    match.transaction.key,
                    {
                        bankAccount: match.bankEntry.bankAccount,
                        transactionRef: match.bankEntry.ref,
                        transactionLabel: match.bankEntry.label,
                    },
                )
                count++
            }
            toast(`Linked ${count} transaction(s)`, { type: 'success' })
            setBalanceOpen(false)
        } catch (error) {
            toast('Failed to link some transactions', { type: 'error' })
        } finally {
            setBalancingTx(false)
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
        const empAccounts = getPartnerAccounts(partner)
        const normalizedEmpAccounts = empAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)

        if (normalizedEmpAccounts.length === 0 && partnerMappedRefs.size === 0) {
            toast('Partner has no bank accounts', { type: 'warning' })
            return
        }

        const consumedByRef = {}
        transactions.forEach((t) => {
            if (t.transactionRef) {
                consumedByRef[t.transactionRef] =
                    (consumedByRef[t.transactionRef] || 0) + (t.amount || 0)
            }
        })

        const matchesEmp = (txAccount) =>
            normalizedEmpAccounts.some(
                (emp) => txAccount.includes(emp) || emp.includes(txAccount),
            )

        const candidates = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const ref = `${s.key}::${i}`
                const isMapped = partnerMappedRefs.has(ref)
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
                const consumed = consumedByRef[ref] || 0
                const available = amount - consumed
                if (available <= 0.01) return
                candidates.push({
                    ref,
                    direction,
                    amount,
                    available,
                    currency: s.valuta || 'RSD',
                    date: t.datumValute,
                    bankAccount: s.partija,
                    description: t.nalogKorisnik || '',
                    opis: t.opis || '',
                    label: `${t.datumValute} | ${fmtNum(amount)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`,
                    partnerMappingKey: partnerMappedRefs.get(ref) || null,
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
            if (bankEntry.partnerMappingKey) {
                const newRemaining =
                    (bankEntry.available || bankEntry.amount) - (tx.amount || 0)
                if (newRemaining < 0.01) {
                    await poslovanjService.unlinkTransactionFromPartner(
                        bankEntry.partnerMappingKey,
                    )
                }
            }
            await poslovanjService.updateEmployeeTransaction(tx.key, {
                bankAccount: bankEntry.bankAccount,
                transactionRef: bankEntry.ref,
                transactionLabel: bankEntry.label,
            })
            toast('Transaction linked', { type: 'success' })
            setItemLinkOpen(false)
        } catch {
            toast('Failed to link transaction', { type: 'error' })
        }
    }

    const handleDiscoverCreate = async () => {
        const selected = discovered.filter((d) => discoverSelected.has(d.ref))
        if (selected.length === 0) return

        setDiscovering(true)
        try {
            let created = 0
            for (const item of selected) {
                await poslovanjService.createEmployeeTransaction({
                    employeeKey: employee.key,
                    direction: item.direction,
                    description: item.description,
                    amount: item.amount,
                    currency: item.currency,
                    date: item.date,
                    bankAccount: item.bankAccount,
                    transactionRef: item.ref,
                    transactionLabel: item.label,
                })
                created++
            }
            toast(`Created ${created} transaction(s)`, { type: 'success' })
            setDiscoverOpen(false)
        } catch (error) {
            toast('Failed to create some transactions', { type: 'error' })
        } finally {
            setDiscovering(false)
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
                        {getPartnerAccounts(partner).length > 0 && (
                            <>
                                <Button
                                    variant="outlined"
                                    startIcon={<SearchRounded />}
                                    onClick={handleDiscover}
                                    size={isMobile ? 'small' : 'medium'}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isMobile ? 'Discover' : 'Auto Discover'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleAutoBalance}
                                    size={isMobile ? 'small' : 'medium'}
                                    sx={{ textTransform: 'none' }}
                                >
                                    {isMobile ? 'Balance' : 'Auto Balance'}
                                </Button>
                            </>
                        )}
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

                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 3,
                        flexWrap: 'wrap',
                    }}
                >
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 140px' }}>
                        <Typography variant="caption" color="text.secondary">
                            Paid Out
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ color: '#d32f2f' }}
                        >
                            {fmtNum(totals.toEmployee)}
                        </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 140px' }}>
                        <Typography variant="caption" color="text.secondary">
                            Received
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ color: '#2e7d32' }}
                        >
                            {fmtNum(totals.fromEmployee)}
                        </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 140px' }}>
                        <Typography variant="caption" color="text.secondary">
                            Balance
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                color:
                                    totals.balance > 0
                                        ? '#d32f2f'
                                        : totals.balance < 0
                                          ? '#2e7d32'
                                          : undefined,
                            }}
                        >
                            {fmtNum(totals.balance)}
                        </Typography>
                    </Paper>
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
                                        {!tx.transactionRef && (
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
                                        {!tx.transactionRef && (
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
                                                {!tx.transactionRef && (
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
                                            {!tx.transactionRef && (
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
                open={discoverOpen}
                onClose={() => setDiscoverOpen(false)}
                fullWidth
                fullScreen={isMobile}
                maxWidth="md"
                PaperProps={{ sx: isMobile ? {} : { borderRadius: 3 } }}
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
                            Discovered Transactions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {discoverSelected.size} of {discovered.length} selected
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => setDiscoverOpen(false)}
                        size="small"
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: isMobile ? 1 : 3 }}>
                    {discovering && <LinearProgress sx={{ mb: 1 }} />}
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={
                                                discovered.length > 0 &&
                                                discoverSelected.size ===
                                                    discovered.length
                                            }
                                            indeterminate={
                                                discoverSelected.size > 0 &&
                                                discoverSelected.size <
                                                    discovered.length
                                            }
                                            onChange={handleDiscoverToggleAll}
                                        />
                                    </TableCell>
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {discovered.map((d) => (
                                    <TableRow
                                        key={d.ref}
                                        hover
                                        onClick={() =>
                                            handleDiscoverToggle(d.ref)
                                        }
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={discoverSelected.has(
                                                    d.ref,
                                                )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {d.datumValute || d.date}
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                noWrap
                                                sx={{
                                                    maxWidth: isMobile
                                                        ? 120
                                                        : 300,
                                                }}
                                            >
                                                {d.description || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    d.direction === 'to'
                                                        ? 'Payment'
                                                        : 'Repayment'
                                                }
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor:
                                                        d.direction === 'to'
                                                            ? '#d32f2f'
                                                            : '#2e7d32',
                                                    color:
                                                        d.direction === 'to'
                                                            ? '#d32f2f'
                                                            : '#2e7d32',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                fontWeight: 600,
                                                color:
                                                    d.direction === 'to'
                                                        ? '#d32f2f'
                                                        : '#2e7d32',
                                            }}
                                        >
                                            {d.direction === 'to' ? '-' : '+'}
                                            {fmtNum(d.amount)} {d.currency}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDiscoverOpen(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDiscoverCreate}
                        disabled={
                            discovering || discoverSelected.size === 0
                        }
                        sx={{ textTransform: 'none' }}
                    >
                        {discovering
                            ? 'Creating...'
                            : `Create ${discoverSelected.size} Transaction(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={balanceOpen}
                onClose={() => setBalanceOpen(false)}
                fullWidth
                fullScreen={isMobile}
                maxWidth="md"
                PaperProps={{ sx: isMobile ? {} : { borderRadius: 3 } }}
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
                            Auto Balance Preview
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {balanceSelected.size} of {balanceMatches.length}{' '}
                            match(es) selected
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => setBalanceOpen(false)}
                        size="small"
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: isMobile ? 1 : 3 }}>
                    {balancingTx && <LinearProgress sx={{ mb: 1 }} />}
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            balanceMatches.length > 0 &&
                                            balanceSelected.size ===
                                                balanceMatches.length
                                        }
                                        indeterminate={
                                            balanceSelected.size > 0 &&
                                            balanceSelected.size <
                                                balanceMatches.length
                                        }
                                        onChange={() => {
                                            if (
                                                balanceSelected.size ===
                                                balanceMatches.length
                                            ) {
                                                setBalanceSelected(new Set())
                                            } else {
                                                setBalanceSelected(
                                                    new Set(
                                                        balanceMatches.map(
                                                            (_, i) => i,
                                                        ),
                                                    ),
                                                )
                                            }
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <strong>Transaction</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Direction</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Amount</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Bank Entry</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {balanceMatches.map((m, i) => (
                                <TableRow
                                    key={i}
                                    hover
                                    onClick={() => handleBalanceToggle(i)}
                                    sx={{
                                        cursor: 'pointer',
                                        opacity: balanceSelected.has(i)
                                            ? 1
                                            : 0.5,
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={balanceSelected.has(i)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap>
                                            {m.transaction.description || '—'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {m.transaction.date}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={
                                                m.transaction.direction === 'to'
                                                    ? 'Payment'
                                                    : 'Repayment'
                                            }
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor:
                                                    m.transaction.direction ===
                                                    'to'
                                                        ? '#d32f2f'
                                                        : '#2e7d32',
                                                color:
                                                    m.transaction.direction ===
                                                    'to'
                                                        ? '#d32f2f'
                                                        : '#2e7d32',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 600,
                                            color:
                                                m.transaction.direction === 'to'
                                                    ? '#d32f2f'
                                                    : '#2e7d32',
                                        }}
                                    >
                                        {fmtNum(m.transaction.amount)}{' '}
                                        {m.transaction.currency || 'RSD'}
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="caption"
                                            noWrap
                                            sx={{
                                                maxWidth: isMobile ? 100 : 250,
                                                display: 'block',
                                            }}
                                        >
                                            {m.bankEntry.datumValute} &middot;{' '}
                                            {m.bankEntry.description}
                                            {m.bankEntry.opis
                                                ? ` - ${m.bankEntry.opis}`
                                                : ''}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setBalanceOpen(false)}
                        sx={{ textTransform: 'none' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleBalanceConfirm}
                        disabled={balancingTx || balanceSelected.size === 0}
                        sx={{ textTransform: 'none' }}
                    >
                        {balancingTx
                            ? 'Linking...'
                            : `Link ${balanceSelected.size} Transaction(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

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
                        {itemLinkTx && (
                            <Typography variant="body2" color="text.secondary">
                                {itemLinkTx.description || '—'} &mdash;{' '}
                                {fmtNum(itemLinkTx.amount)}{' '}
                                {itemLinkTx.currency || 'RSD'}
                            </Typography>
                        )}
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
                                        {itemLinkTx &&
                                        Math.abs(tx.amount - (itemLinkTx.amount || 0)) > 0.01 ? (
                                            <>
                                                {fmtNum(itemLinkTx.amount)}{' '}
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
