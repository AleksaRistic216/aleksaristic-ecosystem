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
    Delete,
    Edit,
    SearchRounded,
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

const getEmployeeAccounts = (employee) => {
    if (employee.bankAccounts && Array.isArray(employee.bankAccounts)) {
        return employee.bankAccounts
    }
    if (employee.bankAccount) {
        return [{ account: employee.bankAccount, primary: true }]
    }
    return []
}

export const EmployeeDetail = ({
    employee,
    transactions,
    statements,
    accounts,
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

    const handleDiscover = () => {
        const empAccounts = getEmployeeAccounts(employee)
        if (empAccounts.length === 0) {
            toast('Employee has no bank accounts set', { type: 'warning' })
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
                        {getEmployeeAccounts(employee).length > 0 && (
                            <Button
                                variant="outlined"
                                startIcon={<SearchRounded />}
                                onClick={handleDiscover}
                                size={isMobile ? 'small' : 'medium'}
                                sx={{ textTransform: 'none' }}
                            >
                                {isMobile ? 'Discover' : 'Auto Discover'}
                            </Button>
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
                    {getEmployeeAccounts(employee).map((acc, i) => (
                        <Chip
                            key={i}
                            label={acc.account}
                            size="small"
                            variant="outlined"
                            color={acc.primary ? 'primary' : 'default'}
                            sx={{ fontFamily: 'monospace' }}
                        />
                    ))}
                    {employee.email && (
                        <Chip
                            label={employee.email}
                            size="small"
                            variant="outlined"
                        />
                    )}
                    {employee.phone && (
                        <Chip
                            label={employee.phone}
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
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(tx)}
                                        >
                                            <Edit fontSize="small" />
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
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(tx)}
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
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
        </Grid>
    )
}
