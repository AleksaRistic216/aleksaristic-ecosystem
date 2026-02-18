import { portfolioService } from '@/app/services/portfolioService'
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Grid,
    IconButton,
    LinearProgress,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material'
import { Close, Add, Edit, ExpandMore } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const getTodayISO = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
}

const isoToSlash = (iso) => iso.replace(/-/g, '/')
const slashToISO = (slash) => slash.replace(/\//g, '-')

const addMonths = (isoDate, months) => {
    const d = new Date(isoDate + 'T00:00:00')
    d.setMonth(d.getMonth() + months)
    return d.toISOString().split('T')[0]
}

const findClosestPrice = (entries, targetDate) => {
    let best = null
    for (const entry of entries) {
        if (entry.date <= targetDate) {
            best = entry
        }
    }
    return best ? best.close : null
}

export const TransactionModal = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode,
    portfolioId,
}) => {
    const [ticker, setTicker] = useState('')
    const [company, setCompany] = useState('')
    const [type, setType] = useState('buy')
    const [shares, setShares] = useState('')
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [date, setDate] = useState(getTodayISO())
    const [loading, setLoading] = useState(false)
    const [tickerLoading, setTickerLoading] = useState(false)

    // Recurring mode
    const [isRecurring, setIsRecurring] = useState(false)
    const [monthlyAmount, setMonthlyAmount] = useState('')
    const [numMonths, setNumMonths] = useState('')
    const [yearlyIncrease, setYearlyIncrease] = useState('')
    const [saveProgress, setSaveProgress] = useState(0)

    const fetchPrice = async (symbol, selectedDate) => {
        const trimmed = (symbol || '').trim().toUpperCase()
        if (!trimmed) return

        setTickerLoading(true)
        try {
            const quoteRes = await fetch(`/api/stock/quote?symbols=${trimmed}`)
            const quoteData = await quoteRes.json()
            const quote = quoteData.quotes?.[trimmed]

            if (quote) {
                setCompany(quote.name || trimmed)
                if (quote.currency === 'GBP' || quote.currency === 'GBp') {
                    setCurrency('GBP')
                } else {
                    setCurrency('USD')
                }
            }

            const isToday = selectedDate === getTodayISO()
            if (isToday && quote) {
                setPrice(String(quote.open || quote.price || ''))
                return
            }

            const histRes = await fetch(
                `/api/stock/history?symbols=${trimmed}&period=max`
            )
            const histData = await histRes.json()
            const entries = histData.history?.[trimmed]
            if (entries && entries.length > 0) {
                const closest = findClosestPrice(entries, selectedDate)
                if (closest) {
                    setPrice(String(closest))
                } else {
                    setPrice(String(entries[0].close))
                }
            } else if (quote) {
                setPrice(String(quote.open || quote.price || ''))
            }
        } catch {
            // ignore
        } finally {
            setTickerLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && initialData && mode === 'edit') {
            setTicker(initialData.data.ticker)
            setCompany(initialData.data.company)
            setType(initialData.data.type)
            setShares(String(initialData.data.shares))
            setPrice(String(initialData.data.price))
            setCurrency(initialData.data.currency || 'USD')
            setDate(slashToISO(initialData.data.date))
            setIsRecurring(false)
        } else if (isOpen && mode === 'create') {
            setTicker('')
            setCompany('')
            setType('buy')
            setShares('')
            setPrice('')
            setCurrency('USD')
            setDate(getTodayISO())
            setIsRecurring(false)
            setMonthlyAmount('')
            setNumMonths('')
            setYearlyIncrease('')
            setSaveProgress(0)
        }
    }, [isOpen, initialData, mode])

    const getMonthlyAmount = (baseAmount, pct, monthIndex) => {
        if (!pct || pct <= 0) return baseAmount
        return baseAmount * Math.pow(1 + pct / 100, Math.floor(monthIndex / 12))
    }

    const handleSaveSingle = async () => {
        if (!shares || Number(shares) <= 0) {
            toast('Broj akcija mora biti veći od 0', { type: 'warning' })
            return
        }

        let fetchedPrice = price
        let fetchedCompany = company
        let fetchedCurrency = currency
        if (!fetchedPrice) {
            const trimmed = ticker.trim().toUpperCase()
            const res = await fetch(`/api/stock/quote?symbols=${trimmed}`)
            const data = await res.json()
            const quote = data.quotes?.[trimmed]
            if (quote) {
                fetchedPrice = String(quote.open || quote.price || '')
                fetchedCompany = quote.name || trimmed
                fetchedCurrency =
                    quote.currency === 'GBP' || quote.currency === 'GBp'
                        ? 'GBP'
                        : 'USD'
            }
        }

        if (!fetchedPrice || Number(fetchedPrice) <= 0) {
            toast('Nije moguće učitati cenu za ovaj ticker', { type: 'error' })
            return
        }

        const txData = {
            ticker: ticker.trim().toUpperCase(),
            company: fetchedCompany || ticker.trim().toUpperCase(),
            type,
            shares: Number(shares),
            price: Number(fetchedPrice),
            currency: fetchedCurrency,
            date: isoToSlash(date),
        }

        if (mode === 'create') {
            await portfolioService.createTransaction(portfolioId, txData)
            toast('Transakcija je uspešno kreirana', { type: 'success' })
        } else if (initialData) {
            await portfolioService.updateTransaction(portfolioId, initialData.key, txData)
            toast('Transakcija je uspešno ažurirana', { type: 'success' })
        }
    }

    const handleSaveRecurring = async () => {
        if (!monthlyAmount || Number(monthlyAmount) <= 0) {
            toast('Mesečni iznos mora biti veći od 0', { type: 'warning' })
            return
        }
        if (!numMonths || Number(numMonths) <= 0) {
            toast('Broj meseci mora biti veći od 0', { type: 'warning' })
            return
        }

        const trimmed = ticker.trim().toUpperCase()
        const months = Number(numMonths)
        const baseAmount = Number(monthlyAmount)
        const increasePct = Number(yearlyIncrease) || 0

        // Fetch quote for company/currency
        const quoteRes = await fetch(`/api/stock/quote?symbols=${trimmed}`)
        const quoteData = await quoteRes.json()
        const quote = quoteData.quotes?.[trimmed]
        const txCompany = quote?.name || trimmed
        const txCurrency =
            quote?.currency === 'GBP' || quote?.currency === 'GBp'
                ? 'GBP'
                : 'USD'

        // Fetch full history
        const histRes = await fetch(
            `/api/stock/history?symbols=${trimmed}&period=max`
        )
        const histData = await histRes.json()
        const entries = histData.history?.[trimmed] || []

        let created = 0
        for (let i = 0; i < months; i++) {
            const txDate = addMonths(date, i)
            const today = getTodayISO()

            let txPrice
            if (txDate >= today && quote) {
                txPrice = quote.open || quote.price
            } else if (entries.length > 0) {
                txPrice = findClosestPrice(entries, txDate)
            }

            if (!txPrice || txPrice <= 0) continue

            const amount = getMonthlyAmount(baseAmount, increasePct, i)
            const txShares = amount / txPrice

            await portfolioService.createTransaction(portfolioId, {
                ticker: trimmed,
                company: txCompany,
                type: 'buy',
                shares: Math.round(txShares * 10000) / 10000,
                price: Math.round(txPrice * 100) / 100,
                currency: txCurrency,
                date: isoToSlash(txDate),
            })
            created++
            setSaveProgress(Math.round(((i + 1) / months) * 100))
        }

        toast(`Kreirano ${created} transakcija`, { type: 'success' })
    }

    const handleSave = async () => {
        if (!ticker.trim()) {
            toast('Ticker je obavezan', { type: 'warning' })
            return
        }
        if (!date) {
            toast('Datum je obavezan', { type: 'warning' })
            return
        }

        setLoading(true)
        setSaveProgress(0)
        try {
            if (isRecurring) {
                await handleSaveRecurring()
            } else {
                await handleSaveSingle()
            }
            onSave()
            onClose()
        } catch (error) {
            toast(
                `Greška pri čuvanju transakcije: ${error.code || error.message}`,
                { type: 'error' }
            )
        } finally {
            setLoading(false)
            setSaveProgress(0)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onClose()
        }
    }

    // Cost summary
    const currencySymbol = currency === 'GBP' ? '\u00A3' : '$'
    const showSingleSummary =
        !isRecurring && price && shares && Number(shares) > 0
    const singleTotal = showSingleSummary
        ? Number(price) * Number(shares)
        : 0

    const showRecurringSummary =
        isRecurring &&
        monthlyAmount &&
        numMonths &&
        Number(monthlyAmount) > 0 &&
        Number(numMonths) > 0
    const recurringEntries = showRecurringSummary
        ? (() => {
              const base = Number(monthlyAmount)
              const pct = Number(yearlyIncrease) || 0
              const m = Number(numMonths)
              const entries = []
              for (let i = 0; i < m; i++) {
                  const amt = getMonthlyAmount(base, pct, i)
                  entries.push({
                      month: i + 1,
                      date: addMonths(date, i),
                      amount: amt,
                  })
              }
              return entries
          })()
        : []
    const recurringTotal = recurringEntries.reduce(
        (sum, e) => sum + e.amount,
        0,
    )
    const [showTransactionList, setShowTransactionList] = useState(false)

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider',
                    pb: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {mode === 'create' ? (
                        <Add color="primary" />
                    ) : (
                        <Edit color="primary" />
                    )}
                    <Typography variant="h6" fontWeight={600}>
                        {mode === 'create'
                            ? 'Nova transakcija'
                            : 'Uredi transakciju'}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    disabled={loading}
                    size="small"
                >
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                    <Grid item xs={12}>
                        <ToggleButtonGroup
                            value={type}
                            exclusive
                            onChange={(e, val) => val && setType(val)}
                            fullWidth
                            disabled={loading || isRecurring}
                        >
                            <ToggleButton
                                value="buy"
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Kupovina
                            </ToggleButton>
                            <ToggleButton
                                value="sell"
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                                Prodaja
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            label="Ticker"
                            fullWidth
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            onBlur={() => fetchPrice(ticker, date)}
                            disabled={loading}
                            placeholder="npr. AAPL, MSFT, ULVR.L"
                            helperText={
                                tickerLoading
                                    ? 'Učitavanje podataka...'
                                    : company
                                      ? company
                                      : 'Unesite ticker i kliknite van polja'
                            }
                            InputProps={
                                tickerLoading
                                    ? {
                                          endAdornment: (
                                              <CircularProgress size={18} />
                                          ),
                                      }
                                    : undefined
                            }
                        />
                    </Grid>
                    {mode === 'create' && (
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isRecurring}
                                        onChange={(e) => {
                                            setIsRecurring(e.target.checked)
                                            if (e.target.checked) {
                                                setType('buy')
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Ponavljajuća mesečna kupovina
                                    </Typography>
                                }
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    px: 2,
                                    py: 0.75,
                                    m: 0,
                                    width: '100%',
                                    justifyContent: 'space-between',
                                }}
                                labelPlacement="start"
                            />
                        </Grid>
                    )}
                    {isRecurring ? (
                        <>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label={`Mesečni iznos (${currencySymbol})`}
                                    fullWidth
                                    type="number"
                                    value={monthlyAmount}
                                    onChange={(e) =>
                                        setMonthlyAmount(e.target.value)
                                    }
                                    disabled={loading}
                                    inputProps={{ min: 0, step: 'any' }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Broj meseci"
                                    fullWidth
                                    type="number"
                                    value={numMonths}
                                    onChange={(e) =>
                                        setNumMonths(e.target.value)
                                    }
                                    disabled={loading}
                                    inputProps={{ min: 1, step: 1 }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Godišnje povećanje (%)"
                                    fullWidth
                                    type="number"
                                    value={yearlyIncrease}
                                    onChange={(e) =>
                                        setYearlyIncrease(e.target.value)
                                    }
                                    disabled={loading}
                                    inputProps={{ min: 0, step: 'any' }}
                                    placeholder="0"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Početni datum"
                                    fullWidth
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    disabled={loading}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    ) : (
                        <>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Broj akcija"
                                    fullWidth
                                    type="number"
                                    value={shares}
                                    onChange={(e) => setShares(e.target.value)}
                                    disabled={loading}
                                    inputProps={{ min: 0, step: 'any' }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    label="Datum"
                                    fullWidth
                                    type="date"
                                    value={date}
                                    onChange={(e) => {
                                        setDate(e.target.value)
                                        fetchPrice(ticker, e.target.value)
                                    }}
                                    disabled={loading}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    )}
                    {showSingleSummary && (
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    bgcolor: 'grey.50',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {type === 'buy'
                                        ? 'Potrebno za kupovinu'
                                        : 'Vrednost prodaje'}
                                </Typography>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{ mt: 0.5 }}
                                >
                                    {currencySymbol}
                                    {singleTotal.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {Number(shares)} x {currencySymbol}
                                    {Number(price).toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}{' '}
                                    po akciji
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                    {showRecurringSummary && (
                        <Grid item xs={12}>
                            <Box
                                sx={{
                                    bgcolor: 'grey.50',
                                    borderRadius: 2,
                                    p: 2,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Ukupno ulaganje ({Number(numMonths)}{' '}
                                    meseci)
                                </Typography>
                                <Typography
                                    variant="h5"
                                    fontWeight={700}
                                    sx={{ mt: 0.5 }}
                                >
                                    {currencySymbol}
                                    {recurringTotal.toLocaleString(undefined, {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {currencySymbol}
                                    {Number(monthlyAmount).toLocaleString(
                                        undefined,
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }
                                    )}{' '}
                                    x {Number(numMonths)} meseci &middot; od{' '}
                                    {date} do {addMonths(date, Number(numMonths) - 1)}
                                    {Number(yearlyIncrease) > 0 &&
                                        ` · +${yearlyIncrease}% godišnje`}
                                </Typography>
                                <Button
                                    size="small"
                                    onClick={() =>
                                        setShowTransactionList(
                                            (v) => !v
                                        )
                                    }
                                    sx={{
                                        textTransform: 'none',
                                        mt: 1,
                                        fontSize: '0.75rem',
                                    }}
                                    endIcon={
                                        <ExpandMore
                                            sx={{
                                                transform:
                                                    showTransactionList
                                                        ? 'rotate(180deg)'
                                                        : 'none',
                                                transition: '0.2s',
                                            }}
                                        />
                                    }
                                >
                                    {showTransactionList
                                        ? 'Sakrij listu'
                                        : 'Prikaži listu transakcija'}
                                </Button>
                            </Box>
                            <Collapse in={showTransactionList}>
                                <Box
                                    sx={{
                                        maxHeight: 200,
                                        overflow: 'auto',
                                        mt: 1,
                                    }}
                                >
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ py: 0.5 }}>
                                                    #
                                                </TableCell>
                                                <TableCell sx={{ py: 0.5 }}>
                                                    Datum
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{ py: 0.5 }}
                                                >
                                                    Iznos
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {recurringEntries.map((entry) => (
                                                <TableRow key={entry.month}>
                                                    <TableCell
                                                        sx={{ py: 0.25 }}
                                                    >
                                                        <Chip
                                                            label={entry.month}
                                                            size="small"
                                                            sx={{
                                                                height: 20,
                                                                fontSize:
                                                                    '0.7rem',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell
                                                        sx={{
                                                            py: 0.25,
                                                            fontSize:
                                                                '0.8rem',
                                                        }}
                                                    >
                                                        {entry.date}
                                                    </TableCell>
                                                    <TableCell
                                                        align="right"
                                                        sx={{
                                                            py: 0.25,
                                                            fontSize:
                                                                '0.8rem',
                                                            fontWeight:
                                                                entry.amount !==
                                                                Number(
                                                                    monthlyAmount
                                                                )
                                                                    ? 600
                                                                    : 400,
                                                        }}
                                                    >
                                                        {currencySymbol}
                                                        {entry.amount.toLocaleString(
                                                            undefined,
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Collapse>
                        </Grid>
                    )}
                    {loading && isRecurring && saveProgress > 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ width: '100%' }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={saveProgress}
                                    sx={{ borderRadius: 1, height: 6 }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}
                                >
                                    Kreiranje transakcija... {saveProgress}%
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 3,
                    py: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                }}
            >
                <Button
                    onClick={handleClose}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                >
                    Otkaži
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading || tickerLoading}
                    sx={{ textTransform: 'none', minWidth: 120 }}
                >
                    {loading ? (
                        <CircularProgress size={20} color="inherit" />
                    ) : mode === 'create' ? (
                        isRecurring
                            ? `Dodaj ${numMonths || '...'} transakcija`
                            : 'Dodaj'
                    ) : (
                        'Sačuvaj'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
