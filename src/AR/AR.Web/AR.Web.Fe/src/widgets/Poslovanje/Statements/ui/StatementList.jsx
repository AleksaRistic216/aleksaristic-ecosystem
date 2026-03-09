import { useAuth } from '@/app/context/AuthContext'
import { poslovanjService } from '@/app/services/poslovanjService'
import { parseStatementXml } from '../../utils/statementParser'
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
    LinearProgress,
} from '@mui/material'
import {
    AccountBalance,
    Add,
    ArrowBack,
    Delete,
    Visibility,
} from '@mui/icons-material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { StatementPreview } from './StatementPreview'
import { ExpenseDialog } from '../../Expenses/ui/ExpenseDialog'
import { GovernmentExpenseDialog } from '../../Government/ui/GovernmentExpenseDialog'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

export const StatementList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const [statements, setStatements] = useState([])
    const [expenses, setExpenses] = useState([])
    const [governmentExpenses, setGovernmentExpenses] = useState([])
    const [forexExchanges, setForexExchanges] = useState([])
    const [invoices, setInvoices] = useState([])
    const [partners, setPartners] = useState([])
    const [transactionPartners, setTransactionPartners] = useState([])
    const [employeeTransactions, setEmployeeTransactions] = useState([])
    const [filterAccount, setFilterAccount] = useState('')
    const [previewStatement, setPreviewStatement] = useState(null)
    const [importing, setImporting] = useState(false)
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
    const [expenseDefaults, setExpenseDefaults] = useState(null)
    const [govExpenseDialogOpen, setGovExpenseDialogOpen] = useState(false)
    const [govExpenseDefaults, setGovExpenseDefaults] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onStatements(setStatements)
        const unsub2 = poslovanjService.onExpenses(setExpenses)
        const unsub3 = poslovanjService.onGovernmentExpenses(
            setGovernmentExpenses,
        )
        const unsub4 = poslovanjService.onForexExchanges(setForexExchanges)
        const unsub5 = poslovanjService.onInvoices(setInvoices)
        const unsub6 = poslovanjService.onPartners(setPartners)
        const unsub7 = poslovanjService.onTransactionPartners(
            setTransactionPartners,
        )
        const unsub8 =
            poslovanjService.onEmployeeTransactions(setEmployeeTransactions)
        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
            unsub5()
            unsub6()
            unsub7()
            unsub8()
        }
    }, [])

    const partnerMap = useMemo(() => {
        const map = {}
        partners.forEach((p) => {
            map[p.key] = p.name
        })
        return map
    }, [partners])

    const linkedByExpenses = useMemo(() => {
        const map = new Map()
        const addRefs = (item, info) => {
            if (item.transactionRefs && typeof item.transactionRefs === 'object') {
                Object.keys(item.transactionRefs).forEach((r) => map.set(r, info))
            } else if (item.transactionRef) {
                map.set(item.transactionRef, info)
            }
        }
        expenses.forEach((e) => {
            addRefs(e, {
                partnerName: partnerMap[e.partnerKey] || '',
                type: 'expense',
            })
        })
        governmentExpenses.forEach((e) => {
            addRefs(e, {
                partnerName: partnerMap[e.partnerKey] || '',
                type: 'government',
            })
        })
        forexExchanges.forEach((fx) => {
            ;(fx.transactions || []).forEach((t) => {
                if (t.ref) {
                    map.set(t.ref, {
                        partnerName: '',
                        type: 'forex',
                    })
                }
            })
        })
        employeeTransactions.forEach((t) => {
            addRefs(t, {
                partnerName: '',
                type: 'employee',
            })
        })
        return map
    }, [expenses, governmentExpenses, forexExchanges, employeeTransactions, partnerMap])

    const linkedByInvoices = useMemo(() => {
        const set = new Set()
        invoices.forEach((inv) => {
            if (inv.linkedStatement) {
                const { statementKey, stavkaIndex } = inv.linkedStatement
                if (statementKey != null && stavkaIndex != null) {
                    set.add(`${statementKey}::${stavkaIndex}`)
                }
            }
        })
        return set
    }, [invoices])

    const linkedByPartners = useMemo(() => {
        const map = new Map()
        transactionPartners.forEach((tp) => {
            if (tp.transactionRef) {
                map.set(tp.transactionRef, tp)
            }
        })
        return map
    }, [transactionPartners])

    const statementStatus = useMemo(() => {
        const map = {}
        statements.forEach((s) => {
            const stavke = s.stavke
                ? Array.isArray(s.stavke)
                    ? s.stavke
                    : Object.values(s.stavke)
                : []
            if (stavke.length === 0) {
                map[s.key] = 'none'
                return
            }
            const allLinked = stavke.every((t, i) => {
                const id = `${s.key}::${i}`
                if (linkedByPartners.has(id)) return true
                if (t.duguje > 0) return linkedByExpenses.has(id)
                if (t.potrazuje > 0) return linkedByInvoices.has(id) || linkedByExpenses.has(id)
                return true
            })
            map[s.key] = allLinked ? 'complete' : 'partial'
        })
        return map
    }, [statements, linkedByExpenses, linkedByInvoices, linkedByPartners])

    const unlinkedItems = useMemo(() => {
        const items = []
        statements.forEach((s) => {
            if (filterAccount && s.partija !== filterAccount) return
            const stavke = s.stavke
                ? Array.isArray(s.stavke)
                    ? s.stavke
                    : Object.values(s.stavke)
                : []
            stavke.forEach((t, i) => {
                const id = `${s.key}::${i}`
                if (linkedByPartners.has(id)) return
                if (t.duguje > 0 && linkedByExpenses.has(id)) return
                if (t.potrazuje > 0 && (linkedByInvoices.has(id) || linkedByExpenses.has(id))) return
                if (t.duguje <= 0 && t.potrazuje <= 0) return
                items.push({
                    id,
                    statement: s,
                    stavka: t,
                    index: i,
                })
            })
        })
        items.sort((a, b) => {
            const da = (a.stavka.datumValute || '').split('.').reverse().join('')
            const db = (b.stavka.datumValute || '').split('.').reverse().join('')
            return db.localeCompare(da)
        })
        return items
    }, [statements, filterAccount, linkedByExpenses, linkedByInvoices, linkedByPartners])

    const accountSummaries = useMemo(() => {
        const map = {}
        for (const s of statements) {
            const dateKey = s.datumIzvoda.split('.').reverse().join('')
            const prev = map[s.partija]
            if (
                !prev ||
                dateKey > prev._dateKey ||
                (dateKey === prev._dateKey &&
                    Number(s.brojIzvoda) > Number(prev.brojIzvoda))
            ) {
                map[s.partija] = {
                    partija: s.partija,
                    novoStanje: s.novoStanje,
                    datumIzvoda: s.datumIzvoda,
                    valuta: s.valuta,
                    brojIzvoda: s.brojIzvoda,
                    _dateKey: dateKey,
                }
            }
        }
        return Object.values(map).sort((a, b) =>
            a.partija.localeCompare(b.partija),
        )
    }, [statements])

    const filtered = useMemo(() => {
        let list = [...statements]
        if (filterAccount) {
            list = list.filter((s) => s.partija === filterAccount)
        }
        list.sort((a, b) => {
            const da = a.datumIzvoda.split('.').reverse().join('')
            const db = b.datumIzvoda.split('.').reverse().join('')
            return db.localeCompare(da)
        })
        return list
    }, [statements, filterAccount])

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

    const handleCreateExpense = (txData) => {
        setExpenseDefaults(txData)
        setExpenseDialogOpen(true)
    }

    const handleCreateGovernmentExpense = (txData) => {
        setGovExpenseDefaults(txData)
        setGovExpenseDialogOpen(true)
    }

    const handleImport = () => {
        fileInputRef.current.value = ''
        fileInputRef.current.click()
    }

    const handleFileSelected = async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        setImporting(true)
        let imported = 0
        let skipped = 0
        const importedIds = new Set()

        try {
            for (const file of files) {
                try {
                    const text = await file.text()
                    const parsed = parseStatementXml(text)

                    const uid = `${parsed.partija}::${parsed.brojIzvoda}::${parsed.datumIzvoda}`
                    const exists = statements.some(
                        (s) =>
                            `${s.partija}::${s.brojIzvoda}::${s.datumIzvoda}` ===
                            uid,
                    )
                    if (exists || importedIds.has(uid)) {
                        skipped++
                        continue
                    }

                    await poslovanjService.createStatement(parsed)
                    importedIds.add(uid)
                    imported++
                } catch (error) {
                    toast(`Failed to parse ${file.name}: ${error.message}`, {
                        type: 'error',
                    })
                }
            }

            if (imported > 0) {
                toast(`Imported ${imported} statement(s)`, { type: 'success' })
            }
            if (skipped > 0) {
                toast(`Skipped ${skipped} duplicate(s)`, { type: 'info' })
            }
        } finally {
            setImporting(false)
        }
    }

    const handleDelete = async (statement) => {
        if (
            !confirm(
                `Delete statement #${statement.brojIzvoda} (${statement.datumIzvoda})?`,
            )
        )
            return
        try {
            await poslovanjService.deleteStatement(statement.key)
            toast('Statement deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleDeleteAll = async () => {
        if (!confirm(`Delete all ${statements.length} statements?`)) return
        try {
            await Promise.all(
                statements.map((s) =>
                    poslovanjService.deleteStatement(s.key),
                ),
            )
            toast('All statements deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    if (!isAdmin) return null

    return (
        <Grid container justifyContent="center" py={4} px={2}>
            <Grid item xs={12} md={10} lg={8}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
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
                        <Typography variant="h5" fontWeight={600}>
                            Bank Statements
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {statements.length > 0 && (
                            <Button
                                variant="outlined"
                                startIcon={<Delete />}
                                onClick={handleDeleteAll}
                                sx={{
                                    textTransform: 'none',
                                    color: '#d32f2f',
                                    borderColor: '#d32f2f',
                                }}
                            >
                                Delete All
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handleImport}
                            disabled={importing}
                            sx={{ textTransform: 'none' }}
                        >
                            {importing ? 'Importing...' : 'Import'}
                        </Button>
                    </Box>
                </Box>

                {accountSummaries.length > 1 && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            mb: 3,
                            flexWrap: 'wrap',
                        }}
                    >
                        {accountSummaries.map((acc) => (
                            <Paper
                                key={acc.partija}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    minWidth: 220,
                                    flex: '1 1 220px',
                                    cursor: 'pointer',
                                    border:
                                        filterAccount === acc.partija
                                            ? '2px solid'
                                            : undefined,
                                    borderColor:
                                        filterAccount === acc.partija
                                            ? 'primary.main'
                                            : undefined,
                                    '&:hover': {
                                        bgcolor: 'grey.50',
                                    },
                                }}
                                onClick={() =>
                                    setFilterAccount(
                                        filterAccount === acc.partija
                                            ? ''
                                            : acc.partija,
                                    )
                                }
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 1,
                                    }}
                                >
                                    <AccountBalance
                                        fontSize="small"
                                        color="action"
                                    />
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {acc.partija}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{
                                        color:
                                            acc.novoStanje >= 0
                                                ? '#2e7d32'
                                                : '#d32f2f',
                                    }}
                                >
                                    {fmtNum(acc.novoStanje)} {acc.valuta}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Last statement: {acc.datumIzvoda} (#{acc.brojIzvoda})
                                </Typography>
                            </Paper>
                        ))}
                    </Box>
                )}

                {importing && <LinearProgress sx={{ mb: 1 }} />}

                {unlinkedItems.length > 0 && (
                    <>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Unlinked Transactions ({unlinkedItems.length})
                        </Typography>
                        <TableContainer
                            component={Paper}
                            variant="outlined"
                            sx={{ mb: 3, maxHeight: 400 }}
                        >
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: 'grey.50' }}>
                                            <strong>Statement</strong>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: 'grey.50' }}>
                                            <strong>Payer / Payee</strong>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: 'grey.50' }}>
                                            <strong>Description</strong>
                                        </TableCell>
                                        <TableCell align="right" sx={{ bgcolor: 'grey.50' }}>
                                            <strong>Amount</strong>
                                        </TableCell>
                                        <TableCell sx={{ bgcolor: 'grey.50' }}>
                                            <strong>Date</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {unlinkedItems.map((item) => {
                                        const isDebit = item.stavka.duguje > 0
                                        const amount = isDebit
                                            ? item.stavka.duguje
                                            : item.stavka.potrazuje
                                        return (
                                            <TableRow
                                                key={item.id}
                                                hover
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() =>
                                                    setPreviewStatement(item.statement)
                                                }
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        #{item.statement.brojIzvoda}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.statement.partija}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {item.stavka.nalogKorisnik || '—'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.stavka.brojRacuna || ''}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {item.stavka.opis || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: isDebit ? '#d32f2f' : '#2e7d32',
                                                    }}
                                                >
                                                    {isDebit ? '−' : '+'}
                                                    {fmtNum(amount)}{' '}
                                                    {item.statement.valuta || 'RSD'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.stavka.datumValute || '—'}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Statements ({filtered.length})
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>
                                    <strong>#</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Date</strong>
                                </TableCell>
                                <TableCell>
                                    <strong>Account</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Previous</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Debit</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Credit</strong>
                                </TableCell>
                                <TableCell align="right">
                                    <strong>Balance</strong>
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
                                        colSpan={8}
                                        align="center"
                                        sx={{
                                            py: 4,
                                            color: 'text.secondary',
                                        }}
                                    >
                                        No statements imported yet
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((s) => (
                                <TableRow
                                    key={s.key}
                                    hover
                                    sx={{
                                        bgcolor:
                                            statementStatus[s.key] === 'complete'
                                                ? 'rgba(46, 125, 50, 0.15)'
                                                : statementStatus[s.key] === 'partial'
                                                    ? 'rgba(237, 108, 2, 0.12)'
                                                    : undefined,
                                    }}
                                >
                                    <TableCell>{s.brojIzvoda}</TableCell>
                                    <TableCell>{s.datumIzvoda}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={s.partija}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {fmtNum(s.prethodnoStanje)} {s.valuta}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color:
                                                s.dugovniPromet > 0
                                                    ? '#d32f2f'
                                                    : undefined,
                                        }}
                                    >
                                        {fmtNum(s.dugovniPromet)} {s.valuta}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            color:
                                                s.potrazniPromet > 0
                                                    ? '#2e7d32'
                                                    : undefined,
                                        }}
                                    >
                                        {fmtNum(s.potrazniPromet)} {s.valuta}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {fmtNum(s.novoStanje)} {s.valuta}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                setPreviewStatement(s)
                                            }
                                            title="Preview"
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(s)}
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
            </Grid>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelected}
            />

            <StatementPreview
                isOpen={!!previewStatement}
                onClose={() => setPreviewStatement(null)}
                statement={previewStatement}
                linkedByExpenses={linkedByExpenses}
                linkedByInvoices={linkedByInvoices}
                linkedByPartners={linkedByPartners}
                partners={partners}
                onCreateExpense={handleCreateExpense}
                onCreateGovernmentExpense={handleCreateGovernmentExpense}
            />

            <ExpenseDialog
                isOpen={expenseDialogOpen}
                onClose={() => {
                    setExpenseDialogOpen(false)
                    setExpenseDefaults(null)
                }}
                expense={null}
                accounts={accounts}
                statements={statements}
                partners={partners}
                allExpenses={expenses}
                defaultTransaction={expenseDefaults}
            />

            <GovernmentExpenseDialog
                isOpen={govExpenseDialogOpen}
                onClose={() => {
                    setGovExpenseDialogOpen(false)
                    setGovExpenseDefaults(null)
                }}
                expense={null}
                partners={partners.filter((p) => p.isGovernment)}
                accounts={accounts}
                statements={statements}
                defaultTransaction={govExpenseDefaults}
            />
        </Grid>
    )
}
