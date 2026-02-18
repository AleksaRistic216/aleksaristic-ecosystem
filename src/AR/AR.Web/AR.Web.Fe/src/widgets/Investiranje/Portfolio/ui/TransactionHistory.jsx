import { useAuth } from '@/app/context/AuthContext'
import { portfolioService } from '@/app/services/portfolioService'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material'
import { Delete, Edit, ExpandMore, Warning } from '@mui/icons-material'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { HoldingsTableContainerStyled } from '../styled/HoldingsTableContainerStyled'

const formatCurrency = (value, currency = 'USD') => {
    const symbol = currency === 'GBP' ? '\u00A3' : '$'
    return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const TransactionHistory = ({
    transactions,
    onEdit,
    onRefresh,
    portfolioId,
}) => {
    const { isAdmin } = useAuth()
    const [deletingTx, setDeletingTx] = useState(undefined)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDeleteConfirm = async () => {
        if (!deletingTx) return

        setIsDeleting(true)
        try {
            await portfolioService.deleteTransaction(portfolioId, deletingTx.key)
            toast('Transakcija je uspešno obrisana', { type: 'success' })
            onRefresh()
        } catch (error) {
            toast(error.message || 'Greška pri brisanju transakcije', {
                type: 'error',
            })
        } finally {
            setIsDeleting(false)
            setDeletingTx(undefined)
        }
    }

    const sortedTransactions = transactions
        ?.slice()
        .sort((a, b) => (b.data.createdAt || 0) - (a.data.createdAt || 0))

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <Accordion
                sx={{
                    borderRadius: '12px !important',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    '&:before': { display: 'none' },
                }}
            >
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Istorija transakcija ({transactions.length})
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    {transactions.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Nema transakcija
                            </Typography>
                        </Box>
                    ) : (
                        <HoldingsTableContainerStyled
                            component={Paper}
                            elevation={0}
                            sx={{
                                margin: 0,
                                boxShadow: 'none',
                                borderRadius: 0,
                            }}
                        >
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Datum</TableCell>
                                        <TableCell>Ticker</TableCell>
                                        <TableCell>Tip</TableCell>
                                        <TableCell align="right">
                                            Akcije
                                        </TableCell>
                                        <TableCell align="right">
                                            Cena
                                        </TableCell>
                                        <TableCell align="right">
                                            Ukupno
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell align="right">
                                                Akcije
                                            </TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sortedTransactions?.map((tx) => (
                                        <TableRow key={tx.key}>
                                            <TableCell>
                                                {tx.data.date}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                >
                                                    {tx.data.ticker}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={
                                                        tx.data.type === 'buy'
                                                            ? 'Kupovina'
                                                            : 'Prodaja'
                                                    }
                                                    size="small"
                                                    sx={{
                                                        bgcolor:
                                                            tx.data.type ===
                                                            'buy'
                                                                ? '#4caf50'
                                                                : '#f44336',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {tx.data.shares}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(
                                                    tx.data.price,
                                                    tx.data.currency
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(
                                                    tx.data.shares *
                                                        tx.data.price,
                                                    tx.data.currency
                                                )}
                                            </TableCell>
                                            {isAdmin && (
                                                <TableCell align="right">
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 0.5,
                                                            justifyContent:
                                                                'flex-end',
                                                        }}
                                                    >
                                                        <Tooltip title="Uredi">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    onEdit(tx)
                                                                }
                                                                sx={{
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            'primary.main',
                                                                        color: 'white',
                                                                    },
                                                                    transition:
                                                                        'all 0.15s ease',
                                                                }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Obriši">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() =>
                                                                    setDeletingTx(
                                                                        tx
                                                                    )
                                                                }
                                                                sx={{
                                                                    '&:hover': {
                                                                        bgcolor:
                                                                            'error.main',
                                                                        color: 'white',
                                                                    },
                                                                    transition:
                                                                        'all 0.15s ease',
                                                                }}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </HoldingsTableContainerStyled>
                    )}
                </AccordionDetails>
            </Accordion>

            <Dialog
                open={!!deletingTx}
                onClose={() => setDeletingTx(undefined)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 },
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <Warning color="error" />
                        Obriši transakciju
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary">
                        Da li ste sigurni da želite da obrišete transakciju za{' '}
                        <strong>{deletingTx?.data.ticker}</strong> (
                        {deletingTx?.data.shares} akcija)?
                    </Typography>
                    <Typography
                        variant="body2"
                        color="error"
                        sx={{ mt: 1 }}
                    >
                        Ova akcija se ne može poništiti.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setDeletingTx(undefined)}
                        disabled={isDeleting}
                        sx={{ textTransform: 'none' }}
                    >
                        Otkaži
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                        sx={{ textTransform: 'none', minWidth: 100 }}
                    >
                        {isDeleting ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Obriši'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
