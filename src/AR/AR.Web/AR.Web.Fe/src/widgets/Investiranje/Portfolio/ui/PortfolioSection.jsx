import { useAuth } from '@/app/context/AuthContext'
import { portfolioService } from '@/app/services/portfolioService'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import {
    Add,
    Delete,
    DeleteSweep,
    Edit,
    ExpandMore,
    Warning,
} from '@mui/icons-material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { PortfolioChart } from './PortfolioChart'
import { HoldingsTable } from './HoldingsTable'
import { TransactionHistory } from './TransactionHistory'
import { TransactionModal } from './TransactionModal'

const computeHoldings = (transactions, quotes) => {
    const holdingsMap = {}

    transactions.forEach((tx) => {
        const { ticker, company, type, shares, price, currency } = tx.data
        if (!holdingsMap[ticker]) {
            holdingsMap[ticker] = {
                ticker,
                company,
                currency,
                totalShares: 0,
                totalCost: 0,
            }
        }
        if (type === 'buy') {
            holdingsMap[ticker].totalCost += shares * price
            holdingsMap[ticker].totalShares += shares
        } else {
            holdingsMap[ticker].totalShares -= shares
        }
    })

    return Object.values(holdingsMap)
        .filter((h) => h.totalShares > 0)
        .map((h) => {
            const quote = quotes[h.ticker]
            const avgPrice =
                h.totalShares > 0 ? h.totalCost / h.totalShares : 0
            const currentPrice = quote?.price || 0
            const totalValue = h.totalShares * currentPrice
            const pnl = totalValue - h.totalShares * avgPrice
            const pnlPercent =
                avgPrice > 0
                    ? ((currentPrice - avgPrice) / avgPrice) * 100
                    : 0

            return {
                ticker: h.ticker,
                company: quote?.name || h.company,
                shares: h.totalShares,
                avgPrice,
                currentPrice,
                totalValue,
                pnl,
                pnlPercent,
                currency: h.currency,
            }
        })
}

const computeChartData = (transactions, historyData) => {
    if (!transactions.length || !Object.keys(historyData).length) return []

    const pricesByDate = {}
    Object.entries(historyData).forEach(([ticker, history]) => {
        history.forEach(({ date, close }) => {
            if (!pricesByDate[date]) pricesByDate[date] = {}
            pricesByDate[date][ticker] = close
        })
    })

    const sortedDates = Object.keys(pricesByDate).sort()
    if (sortedDates.length === 0) return []

    const sortedTxs = transactions
        .slice()
        .sort((a, b) => (a.data.date > b.data.date ? 1 : -1))

    // Build transaction markers by date
    const txByDate = {}
    sortedTxs.forEach((tx) => {
        const txDate = tx.data.date.replace(/\//g, '-')
        if (!txByDate[txDate]) txByDate[txDate] = { buy: false, sell: false }
        if (tx.data.type === 'buy') txByDate[txDate].buy = true
        else txByDate[txDate].sell = true
    })

    const chartData = []
    let lastCarry = {}

    sortedDates.forEach((date) => {
        const sharesHeld = {}
        let deposited = 0
        sortedTxs.forEach((tx) => {
            const txDate = tx.data.date.replace(/\//g, '-')
            if (txDate <= date) {
                const { ticker, type, shares, price } = tx.data
                if (!sharesHeld[ticker]) sharesHeld[ticker] = 0
                if (type === 'buy') {
                    sharesHeld[ticker] += shares
                    deposited += shares * price
                } else {
                    sharesHeld[ticker] -= shares
                    deposited -= shares * price
                }
            }
        })

        let totalValue = 0
        const prices = pricesByDate[date]
        Object.entries(sharesHeld).forEach(([ticker, shares]) => {
            if (shares > 0) {
                const price = prices[ticker] || lastCarry[ticker] || 0
                totalValue += shares * price
                lastCarry[ticker] = price
            }
        })

        if (totalValue > 0 || deposited > 0) {
            chartData.push({
                date,
                value: Math.round(totalValue * 100) / 100,
                deposited: Math.round(deposited * 100) / 100,
                hasBuy: !!txByDate[date]?.buy,
                hasSell: !!txByDate[date]?.sell,
            })
        }
    })

    return chartData
}

export const PortfolioSection = () => {
    const { isAdmin } = useAuth()

    // Portfolio list
    const [portfolios, setPortfolios] = useState([])
    const [expandedId, setExpandedId] = useState(null)
    const [portfoliosLoading, setPortfoliosLoading] = useState(true)

    // Create/rename portfolio dialog
    const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false)
    const [portfolioDialogMode, setPortfolioDialogMode] = useState('create')
    const [editingPortfolioId, setEditingPortfolioId] = useState(null)
    const [portfolioName, setPortfolioName] = useState('')
    const [portfolioDescription, setPortfolioDescription] = useState('')
    const [portfolioDialogLoading, setPortfolioDialogLoading] = useState(false)

    // Delete portfolio dialog
    const [deletePortfolioOpen, setDeletePortfolioOpen] = useState(false)
    const [deletePortfolioId, setDeletePortfolioId] = useState(null)
    const [deletingPortfolio, setDeletingPortfolio] = useState(false)

    // Transaction data for expanded portfolio
    const [transactions, setTransactions] = useState([])
    const [quotes, setQuotes] = useState({})
    const [historyData, setHistoryData] = useState({})
    const [holdings, setHoldings] = useState([])
    const [chartData, setChartData] = useState([])
    const [period, setPeriod] = useState('1y')
    const [isLoading, setIsLoading] = useState(false)
    const [isChartLoading, setIsChartLoading] = useState(false)

    // Transaction modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTx, setEditingTx] = useState(undefined)
    const [modalMode, setModalMode] = useState('create')

    // Delete all transactions
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false)
    const [isDeletingAll, setIsDeletingAll] = useState(false)

    // Track which portfolio was last loaded to avoid re-fetching
    const loadedPortfolioRef = useRef(null)

    const deletePortfolio = portfolios.find((p) => p.key === deletePortfolioId)

    // Load portfolio list
    const loadPortfolios = useCallback(async () => {
        setPortfoliosLoading(true)
        try {
            const list = await portfolioService.getPortfolios()
            setPortfolios(list)
        } catch (error) {
            toast(
                `Greška pri učitavanju portfolija: ${error.code || error.message}`,
                { type: 'error' }
            )
        } finally {
            setPortfoliosLoading(false)
        }
    }, [])

    // Load data for a portfolio
    const fetchQuotes = useCallback(async (tickers) => {
        if (tickers.length === 0) return {}
        try {
            const res = await fetch(
                `/api/stock/quote?symbols=${tickers.join(',')}`
            )
            const data = await res.json()
            return data.quotes || {}
        } catch {
            return {}
        }
    }, [])

    const fetchHistory = useCallback(async (tickers, p) => {
        if (tickers.length === 0) return {}
        try {
            const res = await fetch(
                `/api/stock/history?symbols=${tickers.join(',')}&period=${p}`
            )
            const data = await res.json()
            return data.history || {}
        } catch {
            return {}
        }
    }, [])

    const loadData = useCallback(
        async (portfolioId, p = period) => {
            if (!portfolioId) return
            setIsLoading(true)
            try {
                const txs = await portfolioService.getTransactions(portfolioId)
                setTransactions(txs)

                const tickers = [...new Set(txs.map((tx) => tx.data.ticker))]
                const [quotesData, histData] = await Promise.all([
                    fetchQuotes(tickers),
                    fetchHistory(tickers, p),
                ])

                setQuotes(quotesData)
                setHistoryData(histData)
                setHoldings(computeHoldings(txs, quotesData))
                setChartData(computeChartData(txs, histData))
                loadedPortfolioRef.current = portfolioId
            } catch (error) {
                toast(
                    `Greška pri učitavanju transakcija: ${error.code || error.message}`,
                    { type: 'error' }
                )
            } finally {
                setIsLoading(false)
            }
        },
        [fetchQuotes, fetchHistory, period]
    )

    useEffect(() => {
        loadPortfolios()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Load data when expanding a portfolio
    useEffect(() => {
        if (expandedId) {
            setPeriod('1y')
            loadData(expandedId, '1y')
        } else {
            setTransactions([])
            setHoldings([])
            setChartData([])
            loadedPortfolioRef.current = null
        }
    }, [expandedId]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleAccordionChange = (portfolioId) => (_event, isExpanded) => {
        setExpandedId(isExpanded ? portfolioId : null)
    }

    // Portfolio CRUD
    const handleCreatePortfolio = () => {
        setPortfolioDialogMode('create')
        setPortfolioName('')
        setPortfolioDescription('')
        setPortfolioDialogOpen(true)
    }

    const handleEditPortfolio = (e, portfolio) => {
        e.stopPropagation()
        setPortfolioDialogMode('edit')
        setEditingPortfolioId(portfolio.key)
        setPortfolioName(portfolio.data.name)
        setPortfolioDescription(portfolio.data.description || '')
        setPortfolioDialogOpen(true)
    }

    const handlePortfolioDialogSave = async () => {
        if (!portfolioName.trim()) {
            toast('Naziv je obavezan', { type: 'warning' })
            return
        }
        setPortfolioDialogLoading(true)
        try {
            if (portfolioDialogMode === 'create') {
                const key = await portfolioService.createPortfolio(
                    portfolioName.trim(),
                    portfolioDescription.trim()
                )
                await loadPortfolios()
                setExpandedId(key)
                toast('Portfolio kreiran', { type: 'success' })
            } else {
                await portfolioService.updatePortfolio(
                    editingPortfolioId,
                    {
                        name: portfolioName.trim(),
                        description: portfolioDescription.trim(),
                    }
                )
                await loadPortfolios()
                toast('Portfolio ažuriran', { type: 'success' })
            }
            setPortfolioDialogOpen(false)
        } catch (error) {
            toast(
                `Greška: ${error.code || error.message}`,
                { type: 'error' }
            )
        } finally {
            setPortfolioDialogLoading(false)
        }
    }

    const handleOpenDeletePortfolio = (e, portfolioId) => {
        e.stopPropagation()
        setDeletePortfolioId(portfolioId)
        setDeletePortfolioOpen(true)
    }

    const handleDeletePortfolio = async () => {
        setDeletingPortfolio(true)
        try {
            await portfolioService.deletePortfolio(deletePortfolioId)
            setDeletePortfolioOpen(false)
            if (expandedId === deletePortfolioId) {
                setExpandedId(null)
            }
            setDeletePortfolioId(null)
            await loadPortfolios()
            toast('Portfolio obrisan', { type: 'success' })
        } catch (error) {
            toast(
                `Greška: ${error.code || error.message}`,
                { type: 'error' }
            )
        } finally {
            setDeletingPortfolio(false)
        }
    }

    // Transaction handlers
    const handlePeriodChange = async (newPeriod) => {
        setPeriod(newPeriod)
        setIsChartLoading(true)
        const tickers = [...new Set(transactions.map((tx) => tx.data.ticker))]
        const histData = await fetchHistory(tickers, newPeriod)
        setHistoryData(histData)
        setChartData(computeChartData(transactions, histData))
        setIsChartLoading(false)
    }

    const handleNewTransaction = () => {
        setEditingTx(undefined)
        setModalMode('create')
        setIsModalOpen(true)
    }

    const handleEditTransaction = (tx) => {
        setEditingTx(tx)
        setModalMode('edit')
        setIsModalOpen(true)
    }

    const handleDeleteAll = async () => {
        setIsDeletingAll(true)
        try {
            await portfolioService.deleteAllTransactions(expandedId)
            toast(`Obrisano ${transactions.length} transakcija`, {
                type: 'success',
            })
            setIsDeleteAllOpen(false)
            loadData(expandedId, period)
        } catch (error) {
            toast(
                `Greška pri brisanju: ${error.code || error.message}`,
                { type: 'error' }
            )
        } finally {
            setIsDeletingAll(false)
        }
    }

    const handleSave = () => {
        loadData(expandedId, period)
    }

    if (portfoliosLoading) {
        return (
            <Grid item sm={12} sx={{ mb: 4, textAlign: 'center' }}>
                <CircularProgress size={32} />
            </Grid>
        )
    }

    return (
        <Grid item sm={12} sx={{ mb: 4 }}>
            <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
                {portfolios.map((p) => (
                    <Accordion
                        key={p.key}
                        expanded={expandedId === p.key}
                        onChange={handleAccordionChange(p.key)}
                        sx={{
                            borderRadius: '12px !important',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                            '&:before': { display: 'none' },
                            mb: 1.5,
                            overflow: 'hidden',
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{
                                '& .MuiAccordionSummary-content': {
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mr: 1,
                                },
                            }}
                        >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {p.data.name}
                                </Typography>
                                {p.data.description && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {p.data.description}
                                    </Typography>
                                )}
                            </Box>
                            {isAdmin && (
                                <Box
                                    sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Tooltip title="Uredi">
                                        <IconButton
                                            size="small"
                                            onClick={(e) =>
                                                handleEditPortfolio(e, p)
                                            }
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Obriši portfolio">
                                        <IconButton
                                            size="small"
                                            onClick={(e) =>
                                                handleOpenDeletePortfolio(
                                                    e,
                                                    p.key
                                                )
                                            }
                                            sx={{
                                                '&:hover': {
                                                    color: 'error.main',
                                                },
                                            }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 2, pb: 3 }}>
                            {expandedId === p.key && (
                                <>
                                    {isAdmin && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                                gap: 1,
                                                mb: 2,
                                            }}
                                        >
                                            {transactions.length > 0 && (
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<DeleteSweep />}
                                                    onClick={() =>
                                                        setIsDeleteAllOpen(true)
                                                    }
                                                    size="small"
                                                    sx={{
                                                        textTransform: 'none',
                                                        px: 2,
                                                        fontWeight: 600,
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    Obriši sve
                                                </Button>
                                            )}
                                            <Button
                                                variant="contained"
                                                startIcon={<Add />}
                                                onClick={handleNewTransaction}
                                                size="small"
                                                sx={{
                                                    textTransform: 'none',
                                                    px: 2,
                                                    fontWeight: 600,
                                                    borderRadius: 2,
                                                    boxShadow: 2,
                                                    '&:hover': {
                                                        boxShadow: 4,
                                                    },
                                                }}
                                            >
                                                Nova transakcija
                                            </Button>
                                        </Box>
                                    )}

                                    <PortfolioChart
                                        data={chartData}
                                        period={period}
                                        onPeriodChange={handlePeriodChange}
                                        isLoading={
                                            isLoading || isChartLoading
                                        }
                                    />

                                    <HoldingsTable
                                        holdings={holdings}
                                        isLoading={isLoading}
                                    />

                                    <TransactionHistory
                                        transactions={transactions}
                                        onEdit={handleEditTransaction}
                                        onRefresh={handleSave}
                                        portfolioId={expandedId}
                                    />

                                    <TransactionModal
                                        isOpen={isModalOpen}
                                        onClose={() => setIsModalOpen(false)}
                                        onSave={handleSave}
                                        initialData={editingTx}
                                        mode={modalMode}
                                        portfolioId={expandedId}
                                    />
                                </>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))}

                {isAdmin && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={handleCreatePortfolio}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                borderStyle: 'dashed',
                                px: 3,
                            }}
                        >
                            Novi portfolio
                        </Button>
                    </Box>
                )}

                {portfolios.length === 0 && !isAdmin && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                            Nema portfolija
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Create/Rename portfolio dialog */}
            <Dialog
                open={portfolioDialogOpen}
                onClose={() =>
                    !portfolioDialogLoading && setPortfolioDialogOpen(false)
                }
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    {portfolioDialogMode === 'create'
                        ? 'Novi portfolio'
                        : 'Uredi portfolio'}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        label="Naziv"
                        fullWidth
                        value={portfolioName}
                        onChange={(e) => setPortfolioName(e.target.value)}
                        disabled={portfolioDialogLoading}
                        sx={{ mt: 1 }}
                    />
                    <TextField
                        label="Opis"
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={4}
                        value={portfolioDescription}
                        onChange={(e) => setPortfolioDescription(e.target.value)}
                        disabled={portfolioDialogLoading}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setPortfolioDialogOpen(false)}
                        disabled={portfolioDialogLoading}
                        sx={{ textTransform: 'none' }}
                    >
                        Otkaži
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handlePortfolioDialogSave}
                        disabled={portfolioDialogLoading}
                        sx={{ textTransform: 'none', minWidth: 100 }}
                    >
                        {portfolioDialogLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : portfolioDialogMode === 'create' ? (
                            'Kreiraj'
                        ) : (
                            'Sačuvaj'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete portfolio dialog */}
            <Dialog
                open={deletePortfolioOpen}
                onClose={() =>
                    !deletingPortfolio && setDeletePortfolioOpen(false)
                }
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
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
                        Obriši portfolio
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary">
                        Da li ste sigurni da želite da obrišete{' '}
                        <strong>
                            &quot;{deletePortfolio?.data.name}&quot;
                        </strong>
                        ?
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
                        onClick={() => setDeletePortfolioOpen(false)}
                        disabled={deletingPortfolio}
                        sx={{ textTransform: 'none' }}
                    >
                        Otkaži
                    </Button>
                    <Button
                        onClick={handleDeletePortfolio}
                        color="error"
                        variant="contained"
                        disabled={deletingPortfolio}
                        sx={{ textTransform: 'none', minWidth: 100 }}
                    >
                        {deletingPortfolio ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Obriši'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete all transactions dialog */}
            <Dialog
                open={isDeleteAllOpen}
                onClose={() => !isDeletingAll && setIsDeleteAllOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
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
                        Obriši sve transakcije
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1" color="text.secondary">
                        Da li ste sigurni da želite da obrišete svih{' '}
                        <strong>{transactions.length}</strong> transakcija?
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
                        onClick={() => setIsDeleteAllOpen(false)}
                        disabled={isDeletingAll}
                        sx={{ textTransform: 'none' }}
                    >
                        Otkaži
                    </Button>
                    <Button
                        onClick={handleDeleteAll}
                        color="error"
                        variant="contained"
                        disabled={isDeletingAll}
                        sx={{ textTransform: 'none', minWidth: 100 }}
                    >
                        {isDeletingAll ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Obriši sve'
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </Grid>
    )
}
