import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Chip,
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
    Delete,
    Edit,
} from '@mui/icons-material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ExpenseDialog } from '../../Expenses/ui/ExpenseDialog'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const PAYMENT_LABELS = {
    bank_account: 'Bank Account',
    card: 'Card',
    cash: 'Cash',
}

const normalizeAttachments = (attachments) => {
    if (!attachments) return []
    if (Array.isArray(attachments)) return attachments
    return Object.values(attachments)
}

export const PartnerDetail = ({
    partner,
    invoices,
    expenses,
    employees = [],
    employeeTransactions = [],
    statements,
    accounts,
    allPartners,
    onBack,
    onEditPartner,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
    const [editExpense, setEditExpense] = useState(null)

    const bankAccounts = partner.bankAccounts || []

    const sortedInvoices = useMemo(() => {
        return [...invoices].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [invoices])

    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [expenses])

    const expenseTotals = useMemo(() => {
        let paid = 0
        let unpaid = 0
        expenses.forEach((e) => {
            if (e.status === 'unpaid') unpaid += e.amount || 0
            else paid += e.amount || 0
        })
        return { paid, unpaid }
    }, [expenses])

    const employeeTotals = useMemo(() => {
        let paidOut = 0
        let received = 0
        employeeTransactions.forEach((t) => {
            if (t.direction === 'to') paidOut += t.amount || 0
            else received += t.amount || 0
        })
        return { paidOut, received }
    }, [employeeTransactions])

    const employeeMap = useMemo(() => {
        const map = {}
        employees.forEach((e) => {
            map[e.key] = e.name
        })
        return map
    }, [employees])

    const sortedEmployeeTransactions = useMemo(() => {
        return [...employeeTransactions].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [employeeTransactions])

    const handleDeleteExpense = async (expense) => {
        if (!confirm(`Delete expense "${expense.description || 'Untitled'}"?`))
            return
        try {
            await poslovanjService.deleteExpense(expense.key)
            toast('Expense deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleNewExpense = () => {
        setEditExpense(null)
        setExpenseDialogOpen(true)
    }

    const handleEditExpense = (expense) => {
        setEditExpense(expense)
        setExpenseDialogOpen(true)
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
                                {partner.name}
                            </Typography>
                            {partner.taxId && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Tax ID: {partner.taxId}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                    <IconButton onClick={onEditPartner} title="Edit Partner">
                        <Edit />
                    </IconButton>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        gap: isMobile ? 1 : 2,
                        mb: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    {partner.address && (
                        <Chip
                            label={partner.address}
                            size="small"
                            variant="outlined"
                        />
                    )}
                    {bankAccounts.map((acc, i) => (
                        <Chip
                            key={i}
                            label={acc.account}
                            size="small"
                            variant="outlined"
                            color={acc.primary ? 'primary' : 'default'}
                            sx={{ fontFamily: 'monospace' }}
                        />
                    ))}
                    {partner.email && (
                        <Chip
                            label={partner.email}
                            size="small"
                            variant="outlined"
                        />
                    )}
                    {partner.phone && (
                        <Chip
                            label={partner.phone}
                            size="small"
                            variant="outlined"
                        />
                    )}
                </Box>

                {/* Expense summary */}
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 3,
                        flexWrap: 'wrap',
                    }}
                >
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, flex: '1 1 140px' }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Invoices
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {invoices.length}
                        </Typography>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, flex: '1 1 140px' }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Expenses (Paid)
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ color: '#d32f2f' }}
                        >
                            {fmtNum(expenseTotals.paid)}
                        </Typography>
                    </Paper>
                    {expenseTotals.unpaid > 0 && (
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, flex: '1 1 140px' }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Expenses (Unpaid)
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ color: '#ed6c02' }}
                            >
                                {fmtNum(expenseTotals.unpaid)}
                            </Typography>
                        </Paper>
                    )}
                    {employeeTotals.paidOut > 0 && (
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, flex: '1 1 140px' }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Employee Payouts
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ color: '#d32f2f' }}
                            >
                                {fmtNum(employeeTotals.paidOut)}
                            </Typography>
                        </Paper>
                    )}
                    {employeeTotals.received > 0 && (
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, flex: '1 1 140px' }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Employee Received
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ color: '#2e7d32' }}
                            >
                                {fmtNum(employeeTotals.received)}
                            </Typography>
                        </Paper>
                    )}
                </Box>

                {/* Invoices section */}
                {sortedInvoices.length > 0 && (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, mt: 2 }}
                        >
                            Invoices ({sortedInvoices.length})
                        </Typography>
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ mb: 3 }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell>
                                            <strong>#</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Date</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>Amount</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Status</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedInvoices.map((inv) => (
                                        <TableRow key={inv.key} hover>
                                            <TableCell>
                                                {inv.invoiceNumber || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {inv.date || '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {fmtNum(inv.totalAmount)}{' '}
                                                {inv.currency || 'RSD'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={
                                                        inv.status || 'draft'
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        textTransform:
                                                            'capitalize',
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {/* Employees & transactions section */}
                {employees.length > 0 && (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, mt: 2 }}
                        >
                            Employees ({employees.length})
                        </Typography>
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ mb: 2 }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell>
                                            <strong>Name</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Position</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Email</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {employees.map((emp) => (
                                        <TableRow
                                            key={emp.key}
                                            hover
                                        >
                                            <TableCell>
                                                {emp.name}
                                            </TableCell>
                                            <TableCell>
                                                {emp.position || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {emp.email || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {sortedEmployeeTransactions.length > 0 && (
                            <>
                                <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 1 }}
                                >
                                    Employee Transactions (
                                    {sortedEmployeeTransactions.length})
                                </Typography>
                                <TableContainer
                                    component={Paper}
                                    variant="outlined"
                                    sx={{ mb: 3 }}
                                >
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow
                                                sx={{ bgcolor: 'grey.50' }}
                                            >
                                                <TableCell>
                                                    <strong>Date</strong>
                                                </TableCell>
                                                <TableCell>
                                                    <strong>Employee</strong>
                                                </TableCell>
                                                <TableCell>
                                                    <strong>
                                                        Description
                                                    </strong>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <strong>Amount</strong>
                                                </TableCell>
                                                <TableCell>
                                                    <strong>
                                                        Direction
                                                    </strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedEmployeeTransactions.map(
                                                (t) => (
                                                    <TableRow
                                                        key={t.key}
                                                        hover
                                                    >
                                                        <TableCell>
                                                            {t.date || '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {employeeMap[
                                                                t.employeeKey
                                                            ] || '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {t.description ||
                                                                '—'}
                                                        </TableCell>
                                                        <TableCell
                                                            align="right"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color:
                                                                    t.direction ===
                                                                    'to'
                                                                        ? '#d32f2f'
                                                                        : '#2e7d32',
                                                            }}
                                                        >
                                                            {t.direction ===
                                                            'to'
                                                                ? '−'
                                                                : '+'}
                                                            {fmtNum(
                                                                t.amount,
                                                            )}{' '}
                                                            {t.currency ||
                                                                'RSD'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={
                                                                    t.direction ===
                                                                    'to'
                                                                        ? 'Paid Out'
                                                                        : 'Received'
                                                                }
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{
                                                                    borderColor:
                                                                        t.direction ===
                                                                        'to'
                                                                            ? '#d32f2f'
                                                                            : '#2e7d32',
                                                                    color:
                                                                        t.direction ===
                                                                        'to'
                                                                            ? '#d32f2f'
                                                                            : '#2e7d32',
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </>
                )}

                {/* Expenses section */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                        mt: 2,
                    }}
                >
                    <Typography variant="subtitle2">
                        Expenses ({sortedExpenses.length})
                    </Typography>
                    <Button
                        size="small"
                        startIcon={<Add />}
                        onClick={handleNewExpense}
                        sx={{ textTransform: 'none' }}
                    >
                        Add Expense
                    </Button>
                </Box>

                {isMobile ? (
                    <>
                        {sortedExpenses.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 3,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No expenses yet
                            </Paper>
                        )}
                        {sortedExpenses.map((e) => (
                            <Paper
                                key={e.key}
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
                                            {e.description || '—'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {e.date}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        sx={{ whiteSpace: 'nowrap', ml: 1 }}
                                    >
                                        {fmtNum(e.amount)}{' '}
                                        {e.currency || 'RSD'}
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
                                                e.status === 'unpaid'
                                                    ? 'Unpaid'
                                                    : 'Paid'
                                            }
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor:
                                                    e.status === 'unpaid'
                                                        ? '#ed6c02'
                                                        : '#2e7d32',
                                                color:
                                                    e.status === 'unpaid'
                                                        ? '#ed6c02'
                                                        : '#2e7d32',
                                            }}
                                        />
                                        {normalizeAttachments(e.attachments)
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
                                            onClick={() => handleEditExpense(e)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                handleDeleteExpense(e)
                                            }
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
                                    <TableCell align="right">
                                        <strong>Amount</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Status</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Payment</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Actions</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedExpenses.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            No expenses yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sortedExpenses.map((e) => (
                                    <TableRow key={e.key} hover>
                                        <TableCell>{e.date}</TableCell>
                                        <TableCell>
                                            {e.description || '—'}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {fmtNum(e.amount)}{' '}
                                            {e.currency || 'RSD'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    e.status === 'unpaid'
                                                        ? 'Unpaid'
                                                        : 'Paid'
                                                }
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor:
                                                        e.status === 'unpaid'
                                                            ? '#ed6c02'
                                                            : '#2e7d32',
                                                    color:
                                                        e.status === 'unpaid'
                                                            ? '#ed6c02'
                                                            : '#2e7d32',
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {e.status !== 'unpaid' &&
                                            e.paymentMethod ? (
                                                <Chip
                                                    label={
                                                        PAYMENT_LABELS[
                                                            e.paymentMethod
                                                        ] || e.paymentMethod
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ) : (
                                                '—'
                                            )}
                                        </TableCell>
                                        <TableCell
                                            align="center"
                                            sx={{ whiteSpace: 'nowrap' }}
                                        >
                                            {normalizeAttachments(
                                                e.attachments,
                                            ).length > 0 && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        const atts =
                                                            normalizeAttachments(
                                                                e.attachments,
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
                                                onClick={() =>
                                                    handleEditExpense(e)
                                                }
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleDeleteExpense(e)
                                                }
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

            <ExpenseDialog
                isOpen={expenseDialogOpen}
                onClose={() => setExpenseDialogOpen(false)}
                expense={editExpense}
                accounts={accounts}
                statements={statements}
                partners={allPartners}
                defaultPartnerKey={partner.key}
            />
        </Grid>
    )
}
