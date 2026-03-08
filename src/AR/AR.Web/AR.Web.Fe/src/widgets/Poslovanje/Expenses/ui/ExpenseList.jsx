import { useAuth } from '@/app/context/AuthContext'
import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Chip,
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
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import {
    Add,
    ArrowBack,
    AttachFile,
    ContentCopy,
    Delete,
    Edit,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { ExpenseDialog } from './ExpenseDialog'

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

export const ExpenseList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [expenses, setExpenses] = useState([])
    const [statements, setStatements] = useState([])
    const [partners, setPartners] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editExpense, setEditExpense] = useState(null)
    const [filterMethod, setFilterMethod] = useState('')
    const [filterAccount, setFilterAccount] = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    useEffect(() => {
        const unsub1 = poslovanjService.onExpenses(setExpenses)
        const unsub2 = poslovanjService.onStatements(setStatements)
        const unsub3 = poslovanjService.onPartners(setPartners)
        return () => {
            unsub1()
            unsub2()
            unsub3()
        }
    }, [])

    const partnerMap = useMemo(() => {
        const map = {}
        partners.forEach((p) => {
            map[p.key] = p.name
        })
        return map
    }, [partners])

    const accounts = useMemo(() => {
        const map = {}
        statements.forEach((s) => {
            if (!map[s.partija]) {
                map[s.partija] = {
                    partija: s.partija,
                    valuta: s.valuta || 'RSD',
                }
            }
        })
        return Object.values(map).sort((a, b) =>
            a.partija.localeCompare(b.partija),
        )
    }, [statements])

    const filtered = useMemo(() => {
        let list = [...expenses]
        if (filterMethod) {
            list = list.filter((e) => e.paymentMethod === filterMethod)
        }
        if (filterAccount) {
            list = list.filter((e) => e.bankAccount === filterAccount)
        }
        if (filterStatus) {
            list = list.filter((e) =>
                filterStatus === 'unpaid'
                    ? e.status === 'unpaid'
                    : e.status !== 'unpaid',
            )
        }
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        return list
    }, [expenses, filterMethod, filterAccount, filterStatus])

    const totals = useMemo(() => {
        const byCurrency = {}
        filtered.forEach((e) => {
            const c = e.currency || 'RSD'
            byCurrency[c] = (byCurrency[c] || 0) + (e.amount || 0)
        })
        return byCurrency
    }, [filtered])

    const handleDelete = async (expense) => {
        if (
            !confirm(
                `Delete expense "${expense.description || 'Untitled'}"?`,
            )
        )
            return
        try {
            await poslovanjService.deleteExpense(expense.key)
            toast('Expense deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleNew = () => {
        setEditExpense(null)
        setDialogOpen(true)
    }

    const handleEdit = (expense) => {
        setEditExpense(expense)
        setDialogOpen(true)
    }

    const handleClone = async (expense) => {
        const { key, createdAt, updatedAt, attachments, ...data } = expense
        try {
            await poslovanjService.createExpense({
                ...data,
                status: 'unpaid',
                paymentMethod: '',
                bankAccount: '',
                transactionRef: '',
                transactionLabel: '',
            })
            toast('Expense cloned', { type: 'success' })
        } catch (error) {
            toast('Failed to clone', { type: 'error' })
        }
    }

    if (!isAdmin) return null

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
                        <IconButton
                            onClick={() => router.push('/poslovanje')}
                            size="small"
                        >
                            <ArrowBack />
                        </IconButton>
                        <Typography
                            variant={isMobile ? 'h6' : 'h5'}
                            fontWeight={600}
                        >
                            Expenses
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleNew}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ textTransform: 'none' }}
                    >
                        {isMobile ? 'New' : 'New Expense'}
                    </Button>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        gap: isMobile ? 1 : 2,
                        mb: 2,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    <FormControl
                        size="small"
                        sx={{
                            minWidth: isMobile ? 100 : 120,
                            flex: isMobile ? '1 1 30%' : undefined,
                        }}
                    >
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                            <MenuItem value="unpaid">Unpaid</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl
                        size="small"
                        sx={{
                            minWidth: isMobile ? 100 : 140,
                            flex: isMobile ? '1 1 30%' : undefined,
                        }}
                    >
                        <InputLabel>Payment</InputLabel>
                        <Select
                            value={filterMethod}
                            label="Payment"
                            onChange={(e) => setFilterMethod(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="bank_account">
                                Bank Account
                            </MenuItem>
                            <MenuItem value="card">Card</MenuItem>
                            <MenuItem value="cash">Cash</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl
                        size="small"
                        sx={{
                            minWidth: isMobile ? 100 : 200,
                            flex: isMobile ? '1 1 30%' : undefined,
                        }}
                    >
                        <InputLabel>Account</InputLabel>
                        <Select
                            value={filterAccount}
                            label="Account"
                            onChange={(e) => setFilterAccount(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
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
                    {Object.keys(totals).length > 0 && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                flexWrap: 'wrap',
                                ml: isMobile ? 0 : 'auto',
                                width: isMobile ? '100%' : undefined,
                            }}
                        >
                            {Object.entries(totals).map(([cur, total]) => (
                                <Chip
                                    key={cur}
                                    label={`${fmtNum(total)} ${cur}`}
                                    size="small"
                                    sx={{ fontWeight: 600 }}
                                />
                            ))}
                        </Box>
                    )}
                </Box>

                {isMobile ? (
                    <>
                        {filtered.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No expenses yet
                            </Paper>
                        )}
                        {filtered.map((e) => (
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
                                            {e.partnerKey &&
                                            partnerMap[e.partnerKey]
                                                ? ` · ${partnerMap[e.partnerKey]}`
                                                : ''}
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
                                                    : PAYMENT_LABELS[
                                                          e.paymentMethod
                                                      ] ||
                                                      e.paymentMethod ||
                                                      'Paid'
                                            }
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                borderColor:
                                                    e.status === 'unpaid'
                                                        ? '#ed6c02'
                                                        : undefined,
                                                color:
                                                    e.status === 'unpaid'
                                                        ? '#ed6c02'
                                                        : undefined,
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
                                            onClick={() => handleClone(e)}
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(e)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(e)}
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
                                        <strong>Partner</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Amount</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Status</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Actions</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filtered.length === 0 && (
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
                                {filtered.map((e) => (
                                    <TableRow key={e.key} hover>
                                        <TableCell>{e.date}</TableCell>
                                        <TableCell>
                                            {e.description || '—'}
                                        </TableCell>
                                        <TableCell>
                                            {partnerMap[e.partnerKey] || '—'}
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
                                                onClick={() => handleClone(e)}
                                                title="Clone"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(e)}
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(e)}
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
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                expense={editExpense}
                accounts={accounts}
                statements={statements}
                partners={partners}
            />
        </Grid>
    )
}
