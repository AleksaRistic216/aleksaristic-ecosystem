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
    ContentCopy,
    Delete,
    Edit,
} from '@mui/icons-material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { GovernmentExpenseDialog } from './GovernmentExpenseDialog'

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

export const GovernmentDetail = ({
    partner,
    expenses,
    statements,
    accounts,
    allPartners,
    onBack,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editExpense, setEditExpense] = useState(null)

    const sorted = useMemo(() => {
        return [...expenses].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [expenses])

    const totals = useMemo(() => {
        let paid = 0
        let unpaid = 0
        expenses.forEach((e) => {
            if (e.status === 'unpaid') unpaid += e.amount || 0
            else paid += e.amount || 0
        })
        return { paid, unpaid, total: paid + unpaid }
    }, [expenses])

    const handleDelete = async (expense) => {
        if (!confirm(`Delete "${expense.description || 'Untitled'}"?`)) return
        try {
            await poslovanjService.deleteGovernmentExpense(expense.key)
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
            await poslovanjService.createGovernmentExpense({
                ...data,
                status: 'unpaid',
                bankAccount: '',
                transactionRef: '',
                transactionLabel: '',
            })
            toast('Expense cloned', { type: 'success' })
        } catch (error) {
            toast('Failed to clone', { type: 'error' })
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
                                {partner.name}
                            </Typography>
                            {partner.taxId && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {partner.taxId}
                                </Typography>
                            )}
                        </Box>
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
                            Total
                        </Typography>
                        <Typography variant="h6" fontWeight={600}>
                            {fmtNum(totals.total)} RSD
                        </Typography>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, flex: '1 1 140px' }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Paid
                        </Typography>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ color: '#2e7d32' }}
                        >
                            {fmtNum(totals.paid)}
                        </Typography>
                    </Paper>
                    {totals.unpaid > 0 && (
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, flex: '1 1 140px' }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Unpaid
                            </Typography>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{ color: '#ed6c02' }}
                            >
                                {fmtNum(totals.unpaid)}
                            </Typography>
                        </Paper>
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
                                No expenses yet
                            </Paper>
                        )}
                        {sorted.map((e) => (
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
                                            onClick={() => handleEdit(e)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleClone(e)}
                                        >
                                            <ContentCopy fontSize="small" />
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
                                            No expenses yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sorted.map((e) => (
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
                                                onClick={() => handleEdit(e)}
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleClone(e)}
                                                title="Clone"
                                            >
                                                <ContentCopy fontSize="small" />
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

            <GovernmentExpenseDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                expense={editExpense}
                partners={allPartners.filter((p) => p.isGovernment)}
                accounts={accounts}
                statements={statements}
                defaultPartnerKey={partner.key}
            />
        </Grid>
    )
}
