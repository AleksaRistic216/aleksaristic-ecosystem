import { useAuth } from '@/app/context/AuthContext'
import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Chip,
    Collapse,
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
import { Add, ArrowBack, Delete, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { ForexDialog } from './ForexDialog'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const normalizeStavke = (stavke) => {
    if (!stavke) return []
    if (Array.isArray(stavke)) return stavke
    return Object.values(stavke)
}

export const ForexList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [exchanges, setExchanges] = useState([])
    const [statements, setStatements] = useState([])
    const [expenses, setExpenses] = useState([])
    const [governmentExpenses, setGovernmentExpenses] = useState([])
    const [invoices, setInvoices] = useState([])
    const [transactionPartners, setTransactionPartners] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [expandedKey, setExpandedKey] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onForexExchanges(setExchanges)
        const unsub2 = poslovanjService.onStatements(setStatements)
        const unsub3 = poslovanjService.onExpenses(setExpenses)
        const unsub4 = poslovanjService.onGovernmentExpenses(
            setGovernmentExpenses,
        )
        const unsub5 = poslovanjService.onInvoices(setInvoices)
        const unsub6 = poslovanjService.onTransactionPartners(
            setTransactionPartners,
        )
        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
            unsub5()
            unsub6()
        }
    }, [])

    const linkedRefs = useMemo(() => {
        const set = new Set()
        expenses.forEach((e) => {
            if (e.transactionRef) set.add(e.transactionRef)
        })
        governmentExpenses.forEach((e) => {
            if (e.transactionRef) set.add(e.transactionRef)
        })
        invoices.forEach((inv) => {
            if (inv.linkedStatement) {
                const { statementKey, stavkaIndex } = inv.linkedStatement
                if (statementKey != null && stavkaIndex != null) {
                    set.add(`${statementKey}::${stavkaIndex}`)
                }
            }
        })
        transactionPartners.forEach((tp) => {
            if (tp.transactionRef) set.add(tp.transactionRef)
        })
        exchanges.forEach((fx) => {
            ;(fx.transactions || []).forEach((t) => {
                if (t.ref) set.add(t.ref)
            })
        })
        return set
    }, [expenses, governmentExpenses, invoices, transactionPartners, exchanges])

    const sorted = useMemo(() => {
        return [...exchanges].sort((a, b) =>
            (b.date || '').localeCompare(a.date || ''),
        )
    }, [exchanges])

    const stavkeMap = useMemo(() => {
        const map = {}
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                map[`${s.key}::${i}`] = {
                    ...t,
                    partija: s.partija,
                    valuta: s.valuta || 'RSD',
                }
            })
        })
        return map
    }, [statements])

    const handleDelete = async (exchange) => {
        if (!confirm('Delete this forex exchange?')) return
        try {
            await poslovanjService.deleteForexExchange(exchange.key)
            toast('Exchange deleted', { type: 'success' })
        } catch {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const summarize = (transactions) => {
        const debits = {}
        const credits = {}
        ;(transactions || []).forEach((t) => {
            const target = t.isDebit ? debits : credits
            target[t.currency] = (target[t.currency] || 0) + t.amount
        })
        const debitEntries = Object.entries(debits)
        const creditEntries = Object.entries(credits)
        let rate = ''
        if (debitEntries.length === 1 && creditEntries.length === 1) {
            const [dCur, dAmt] = debitEntries[0]
            const [cCur, cAmt] = creditEntries[0]
            if (dCur !== cCur && dAmt > 0) {
                const r = cAmt / dAmt
                rate = `1 ${dCur} = ${r.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${cCur}`
            }
        }
        return { debits, credits, rate }
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
                            Forex Exchanges
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setDialogOpen(true)}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ textTransform: 'none' }}
                    >
                        {isMobile ? 'New' : 'New Exchange'}
                    </Button>
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
                                No forex exchanges yet
                            </Paper>
                        )}
                        {sorted.map((fx) => {
                            const summary = summarize(fx.transactions)
                            const { debits, credits } = summary
                            const isExpanded = expandedKey === fx.key
                            return (
                                <Paper
                                    key={fx.key}
                                    variant="outlined"
                                    sx={{ mb: 1.5, p: 2 }}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            mb: 1,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            onClick={() =>
                                                setExpandedKey(
                                                    isExpanded
                                                        ? null
                                                        : fx.key,
                                                )
                                            }
                                            sx={{ cursor: 'pointer', flex: 1 }}
                                        >
                                            {fx.date}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(fx)}
                                            sx={{ color: '#d32f2f' }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            flexWrap: 'wrap',
                                        }}
                                        onClick={() =>
                                            setExpandedKey(
                                                isExpanded ? null : fx.key,
                                            )
                                        }
                                    >
                                        {Object.entries(debits).map(
                                            ([cur, amt]) => (
                                                <Chip
                                                    key={`d-${cur}`}
                                                    label={`-${fmtNum(amt)} ${cur}`}
                                                    size="small"
                                                    sx={{
                                                        color: '#d32f2f',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            ),
                                        )}
                                        {Object.entries(credits).map(
                                            ([cur, amt]) => (
                                                <Chip
                                                    key={`c-${cur}`}
                                                    label={`+${fmtNum(amt)} ${cur}`}
                                                    size="small"
                                                    sx={{
                                                        color: '#2e7d32',
                                                        fontWeight: 600,
                                                    }}
                                                />
                                            ),
                                        )}
                                    </Box>
                                    {summary.rate && (
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{ mt: 0.5 }}
                                        >
                                            {summary.rate}
                                        </Typography>
                                    )}
                                    {fx.note && (
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 0.5, display: 'block' }}
                                        >
                                            {fx.note}
                                        </Typography>
                                    )}
                                    <Collapse in={isExpanded}>
                                        <Box sx={{ mt: 1.5 }}>
                                            {(fx.transactions || []).map(
                                                (t) => {
                                                    const s =
                                                        stavkeMap[t.ref]
                                                    const amt =
                                                        s?.duguje > 0
                                                            ? s.duguje
                                                            : s?.potrazuje
                                                    const isDebit =
                                                        s?.duguje > 0
                                                    return (
                                                        <Box
                                                            key={t.ref}
                                                            sx={{
                                                                py: 0.5,
                                                                borderTop: 1,
                                                                borderColor:
                                                                    'divider',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    justifyContent:
                                                                        'space-between',
                                                                }}
                                                            >
                                                                <Typography
                                                                    variant="body2"
                                                                    noWrap
                                                                >
                                                                    {s?.nalogKorisnik ||
                                                                        '—'}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    fontWeight={
                                                                        600
                                                                    }
                                                                    sx={{
                                                                        color: isDebit
                                                                            ? '#d32f2f'
                                                                            : '#2e7d32',
                                                                        whiteSpace:
                                                                            'nowrap',
                                                                        ml: 1,
                                                                    }}
                                                                >
                                                                    {isDebit
                                                                        ? '-'
                                                                        : '+'}
                                                                    {fmtNum(
                                                                        amt,
                                                                    )}{' '}
                                                                    {s?.valuta}
                                                                </Typography>
                                                            </Box>
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                            >
                                                                {s?.datumValute}{' '}
                                                                · {s?.partija}
                                                                {s?.opis
                                                                    ? ` · ${s.opis}`
                                                                    : ''}
                                                            </Typography>
                                                        </Box>
                                                    )
                                                },
                                            )}
                                        </Box>
                                    </Collapse>
                                </Paper>
                            )
                        })}
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
                                        <strong>Debit</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Credit</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Rate</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Note</strong>
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
                                            colSpan={6}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            No forex exchanges yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sorted.map((fx) => {
                                    const { debits, credits, rate } = summarize(
                                        fx.transactions,
                                    )
                                    const isExpanded = expandedKey === fx.key
                                    return [
                                        <TableRow
                                            key={fx.key}
                                            hover
                                            onClick={() =>
                                                setExpandedKey(
                                                    isExpanded ? null : fx.key,
                                                )
                                            }
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>{fx.date}</TableCell>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 0.5,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {Object.entries(
                                                        debits,
                                                    ).map(([cur, amt]) => (
                                                        <Chip
                                                            key={cur}
                                                            label={`${fmtNum(amt)} ${cur}`}
                                                            size="small"
                                                            sx={{
                                                                color: '#d32f2f',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 0.5,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    {Object.entries(
                                                        credits,
                                                    ).map(([cur, amt]) => (
                                                        <Chip
                                                            key={cur}
                                                            label={`${fmtNum(amt)} ${cur}`}
                                                            size="small"
                                                            sx={{
                                                                color: '#2e7d32',
                                                                fontWeight: 600,
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            </TableCell>
                                            <TableCell
                                                sx={{
                                                    fontWeight: 600,
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {rate || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {fx.note || '—'}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        setExpandedKey(
                                                            isExpanded
                                                                ? null
                                                                : fx.key,
                                                        )
                                                    }
                                                    title="Details"
                                                >
                                                    {isExpanded ? (
                                                        <KeyboardArrowUp fontSize="small" />
                                                    ) : (
                                                        <KeyboardArrowDown fontSize="small" />
                                                    )}
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleDelete(fx)
                                                    }
                                                    title="Delete"
                                                    sx={{ color: '#d32f2f' }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>,
                                        <TableRow key={`${fx.key}-detail`}>
                                            <TableCell
                                                colSpan={7}
                                                sx={{
                                                    py: 0,
                                                    borderBottom: isExpanded
                                                        ? undefined
                                                        : 'none',
                                                }}
                                            >
                                                <Collapse in={isExpanded}>
                                                    <Table
                                                        size="small"
                                                        sx={{ my: 1 }}
                                                    >
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>
                                                                    <strong>
                                                                        Date
                                                                    </strong>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <strong>
                                                                        Account
                                                                    </strong>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <strong>
                                                                        Payer/Payee
                                                                    </strong>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <strong>
                                                                        Description
                                                                    </strong>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <strong>
                                                                        Debit
                                                                    </strong>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <strong>
                                                                        Credit
                                                                    </strong>
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {(
                                                                fx.transactions ||
                                                                []
                                                            ).map((t) => {
                                                                const s =
                                                                    stavkeMap[
                                                                        t.ref
                                                                    ]
                                                                return (
                                                                    <TableRow
                                                                        key={
                                                                            t.ref
                                                                        }
                                                                    >
                                                                        <TableCell>
                                                                            {s?.datumValute ||
                                                                                '—'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Chip
                                                                                label={`${s?.partija || '?'} (${s?.valuta || t.currency})`}
                                                                                size="small"
                                                                                variant="outlined"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {s?.nalogKorisnik ||
                                                                                '—'}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {s?.opis ||
                                                                                '—'}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            align="right"
                                                                            sx={{
                                                                                color:
                                                                                    s?.duguje >
                                                                                    0
                                                                                        ? '#d32f2f'
                                                                                        : undefined,
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {s?.duguje >
                                                                            0
                                                                                ? `${fmtNum(s.duguje)} ${s.valuta}`
                                                                                : ''}
                                                                        </TableCell>
                                                                        <TableCell
                                                                            align="right"
                                                                            sx={{
                                                                                color:
                                                                                    s?.potrazuje >
                                                                                    0
                                                                                        ? '#2e7d32'
                                                                                        : undefined,
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {s?.potrazuje >
                                                                            0
                                                                                ? `${fmtNum(s.potrazuje)} ${s.valuta}`
                                                                                : ''}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>,
                                    ]
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Grid>

            <ForexDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                statements={statements}
                linkedRefs={linkedRefs}
            />
        </Grid>
    )
}
