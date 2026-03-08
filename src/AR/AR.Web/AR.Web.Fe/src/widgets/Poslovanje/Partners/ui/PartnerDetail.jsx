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
    Tooltip,
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
    InfoOutlined,
    LinkOff,
    SyncAlt,
} from '@mui/icons-material'
import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { ExpenseDialog } from '../../Expenses/ui/ExpenseDialog'
import { EmployeeTransactionDialog } from '../../Employees/ui/EmployeeTransactionDialog'
import { GovernmentExpenseDialog } from '../../Government/ui/GovernmentExpenseDialog'
import { StatementPreview } from '../../Statements/ui/StatementPreview'

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

const normalizeAccount = (acc) => {
    if (!acc) return ''
    return acc.replace(/\D/g, '')
}

const normalizeStavke = (stavke) => {
    if (!stavke) return []
    if (Array.isArray(stavke)) return stavke
    return Object.values(stavke)
}

export const PartnerDetail = ({
    partner,
    invoices,
    expenses,
    employees = [],
    employeeTransactions = [],
    transactionPartners = [],
    statements,
    accounts,
    allPartners,
    allExpenses = [],
    allInvoices = [],
    allTransactionPartners = [],
    governmentExpenses = [],
    forexExchanges = [],
    onBack,
    onEditPartner,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false)
    const [editExpense, setEditExpense] = useState(null)
    const [empTxDialogOpen, setEmpTxDialogOpen] = useState(false)
    const [editEmpTx, setEditEmpTx] = useState(null)
    const [govExpDialogOpen, setGovExpDialogOpen] = useState(false)
    const [editGovExp, setEditGovExp] = useState(null)
    const [previewStatement, setPreviewStatement] = useState(null)

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

    const partnerGovExpenses = useMemo(() => {
        return governmentExpenses
            .filter((e) => e.partnerKey === partner.key)
            .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    }, [governmentExpenses, partner.key])

    const govExpenseTotals = useMemo(() => {
        let paid = 0
        let unpaid = 0
        partnerGovExpenses.forEach((e) => {
            if (e.status === 'unpaid') unpaid += e.amount || 0
            else paid += e.amount || 0
        })
        return { paid, unpaid }
    }, [partnerGovExpenses])

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
        let unlinked = 0
        employeeTransactions.forEach((t) => {
            const amt = t.amount || 0
            if (t.direction === 'to') paidOut += amt
            else received += amt
            if (!t.transactionRef) unlinked += amt
        })
        return { paidOut, received, unlinked }
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

    const resolvedMappedTransactions = useMemo(() => {
        const stmtMap = {}
        statements.forEach((s) => {
            stmtMap[s.key] = s
        })
        const consumedByRef = {}
        expenses.forEach((e) => {
            if (e.transactionRef) {
                consumedByRef[e.transactionRef] =
                    (consumedByRef[e.transactionRef] || 0) + (e.amount || 0)
            }
        })
        return transactionPartners
            .map((tp) => {
                const [stmtKey, idxStr] = (tp.transactionRef || '').split('::')
                const stmt = stmtMap[stmtKey]
                if (!stmt) return null
                const stavke = normalizeStavke(stmt.stavke)
                const stavka = stavke[Number(idxStr)]
                if (!stavka) return null
                const consumed = consumedByRef[tp.transactionRef] || 0
                const fullAmount = stavka.duguje > 0
                    ? stavka.duguje
                    : stavka.potrazuje
                const remaining = fullAmount - consumed
                if (remaining < 0.01) return null
                return {
                    ...tp,
                    stavka,
                    statement: stmt,
                    remaining,
                }
            })
            .filter(Boolean)
            .sort((a, b) =>
                (b.stavka.datumValute || '').localeCompare(
                    a.stavka.datumValute || '',
                ),
            )
    }, [transactionPartners, statements, expenses])

    const mappedTotals = useMemo(() => {
        let debit = 0
        let credit = 0
        resolvedMappedTransactions.forEach((t) => {
            if (t.stavka.duguje > 0) debit += t.remaining
            if (t.stavka.potrazuje > 0) credit += t.remaining
        })
        return { debit, credit }
    }, [resolvedMappedTransactions])

    const expenseTxMap = useMemo(() => {
        const stmtMap = {}
        statements.forEach((s) => { stmtMap[s.key] = s })
        const map = {}
        expenses.forEach((e) => {
            if (!e.transactionRef) return
            const [stmtKey, idxStr] = e.transactionRef.split('::')
            const stmt = stmtMap[stmtKey]
            if (!stmt) return
            const stavke = normalizeStavke(stmt.stavke)
            const stavka = stavke[Number(idxStr)]
            if (!stavka) return
            map[e.key] = {
                stmtKey,
                date: stavka.datumValute,
                payer: stavka.nalogKorisnik,
                opis: stavka.opis,
                amount: stavka.duguje,
                currency: stmt.valuta || 'RSD',
                brojIzvoda: stmt.brojIzvoda,
            }
        })
        return map
    }, [expenses, statements])

    const govExpTxMap = useMemo(() => {
        const stmtMap = {}
        statements.forEach((s) => { stmtMap[s.key] = s })
        const map = {}
        partnerGovExpenses.forEach((e) => {
            if (!e.transactionRef) return
            const [stmtKey, idxStr] = e.transactionRef.split('::')
            const stmt = stmtMap[stmtKey]
            if (!stmt) return
            const stavke = normalizeStavke(stmt.stavke)
            const stavka = stavke[Number(idxStr)]
            if (!stavka) return
            map[e.key] = {
                stmtKey,
                date: stavka.datumValute,
                payer: stavka.nalogKorisnik,
                opis: stavka.opis,
                amount: stavka.duguje,
                currency: stmt.valuta || 'RSD',
                brojIzvoda: stmt.brojIzvoda,
            }
        })
        return map
    }, [partnerGovExpenses, statements])

    const partnerNameMap = useMemo(() => {
        const map = {}
        allPartners.forEach((p) => { map[p.key] = p.name })
        return map
    }, [allPartners])

    const linkedByExpenses = useMemo(() => {
        const map = new Map()
        allExpenses.forEach((e) => {
            if (e.transactionRef) {
                map.set(e.transactionRef, {
                    partnerName: partnerNameMap[e.partnerKey] || '',
                    type: 'expense',
                })
            }
        })
        governmentExpenses.forEach((e) => {
            if (e.transactionRef) {
                map.set(e.transactionRef, {
                    partnerName: partnerNameMap[e.partnerKey] || '',
                    type: 'government',
                })
            }
        })
        forexExchanges.forEach((fx) => {
            ;(fx.transactions || []).forEach((t) => {
                if (t.ref) {
                    map.set(t.ref, { partnerName: '', type: 'forex' })
                }
            })
        })
        return map
    }, [allExpenses, governmentExpenses, forexExchanges, partnerNameMap])

    const linkedByInvoices = useMemo(() => {
        const set = new Set()
        allInvoices.forEach((inv) => {
            if (inv.linkedStatement) {
                const { statementKey, stavkaIndex } = inv.linkedStatement
                if (statementKey != null && stavkaIndex != null) {
                    set.add(`${statementKey}::${stavkaIndex}`)
                }
            }
        })
        return set
    }, [allInvoices])

    const linkedByPartners = useMemo(() => {
        const map = new Map()
        allTransactionPartners.forEach((tp) => {
            if (tp.transactionRef) {
                map.set(tp.transactionRef, tp)
            }
        })
        return map
    }, [allTransactionPartners])

    const invoiceTotal = useMemo(() => {
        let sum = 0
        invoices.forEach((inv) => { sum += inv.totalAmount || 0 })
        return sum
    }, [invoices])

    const bankTotals = useMemo(() => {
        // Mapped transactions (standalone bank movements, remaining after expense consumption)
        let debit = mappedTotals.debit
        let credit = mappedTotals.credit
        // Expenses linked to bank statements — use expense amount (not bank txn amount)
        // so it cancels cleanly against totalExpenses in the balance formula
        expenses.forEach((e) => {
            if (e.transactionRef) debit += e.amount || 0
        })
        // Invoices linked to bank statements — use invoice amount
        invoices.forEach((inv) => {
            if (inv.linkedStatement) credit += inv.totalAmount || 0
        })
        // Employee transactions linked to bank statements — use txn amount
        employeeTransactions.forEach((t) => {
            if (!t.transactionRef) return
            const amt = t.amount || 0
            if (t.direction === 'to') debit += amt
            else credit += amt
        })
        // Government expenses linked to bank statements — use expense amount
        partnerGovExpenses.forEach((e) => {
            if (e.transactionRef) debit += e.amount || 0
        })
        return { debit, credit }
    }, [expenses, invoices, employeeTransactions, partnerGovExpenses, mappedTotals])

    const totalExpenses =
        expenseTotals.paid + expenseTotals.unpaid + employeeTotals.paidOut +
        govExpenseTotals.paid + govExpenseTotals.unpaid
    const totalIncome = invoiceTotal + employeeTotals.received
    // Balance from partner's perspective:
    // Positive = partner has credit with us (we owe them)
    // Negative = partner owes us (we overpaid)
    const balance =
        totalExpenses - totalIncome - bankTotals.debit + bankTotals.credit

    const handleUnlinkTransactionPartner = async (tp) => {
        try {
            await poslovanjService.unlinkTransactionFromPartner(tp.key)
            toast('Unlinked from partner', { type: 'success' })
        } catch {
            toast('Failed to unlink', { type: 'error' })
        }
    }

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

    const [balanceOpen, setBalanceOpen] = useState(false)
    const [balanceMatches, setBalanceMatches] = useState([])
    const [balanceSelected, setBalanceSelected] = useState(new Set())
    const [balancing, setBalancing] = useState(false)

    const partnerMappedRefs = useMemo(() => {
        const map = new Map()
        transactionPartners.forEach((tp) => {
            if (tp.transactionRef) map.set(tp.transactionRef, tp.key)
        })
        return map
    }, [transactionPartners])

    const handleAutoBalance = () => {
        const partnerAccounts = bankAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)
        if (
            partnerAccounts.length === 0 &&
            partnerMappedRefs.size === 0
        ) {
            toast('Partner has no bank accounts', { type: 'warning' })
            return
        }

        const consumedByRef = {}
        expenses.forEach((e) => {
            if (e.transactionRef) {
                consumedByRef[e.transactionRef] =
                    (consumedByRef[e.transactionRef] || 0) + (e.amount || 0)
            }
        })

        const matchesPartner = (txAccount) =>
            partnerAccounts.some(
                (pa) => txAccount.includes(pa) || pa.includes(txAccount),
            )

        const bankTxns = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const ref = `${s.key}::${i}`
                const isMapped = partnerMappedRefs.has(ref)
                if (!isMapped) {
                    const txAccount = normalizeAccount(t.brojRacuna)
                    if (!txAccount || !matchesPartner(txAccount)) return
                }
                if (t.duguje <= 0) return
                const consumed = consumedByRef[ref] || 0
                const available = t.duguje - consumed
                if (available <= 0.01) return
                bankTxns.push({
                    ref,
                    amount: t.duguje,
                    available,
                    currency: s.valuta || 'RSD',
                    date: t.datumValute,
                    bankAccount: s.partija,
                    description: t.nalogKorisnik || '',
                    opis: t.opis || '',
                    label: `${t.datumValute} | ${fmtNum(t.duguje)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`,
                    partnerMappingKey: partnerMappedRefs.get(ref) || null,
                })
            })
        })

        if (bankTxns.length === 0) {
            toast('No unlinked bank transactions for this partner', {
                type: 'info',
            })
            return
        }

        const unpaid = expenses
            .filter((e) => e.status === 'unpaid')
            .sort((a, b) => (a.date || '').localeCompare(b.date || ''))

        if (unpaid.length === 0) {
            toast('No unpaid expenses to balance', { type: 'info' })
            return
        }

        bankTxns.sort((a, b) => (a.date || '').localeCompare(b.date || ''))

        const usedExpenses = new Set()
        const matches = []

        bankTxns.forEach((tx) => {
            let remaining = tx.available
            const assigned = []

            unpaid.forEach((exp) => {
                if (usedExpenses.has(exp.key)) return
                if (remaining <= 0) return
                const expAmount = exp.amount || 0
                if (expAmount <= remaining + 0.01) {
                    assigned.push(exp)
                    remaining -= expAmount
                    usedExpenses.add(exp.key)
                }
            })

            if (assigned.length > 0) {
                matches.push({
                    transaction: tx,
                    expenses: assigned,
                    totalExpenses: assigned.reduce(
                        (sum, e) => sum + (e.amount || 0),
                        0,
                    ),
                    remainder: remaining,
                })
            }
        })

        if (matches.length === 0) {
            toast('Could not match any transactions to expenses', {
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

        setBalancing(true)
        try {
            let count = 0
            for (const match of selected) {
                if (
                    match.transaction.partnerMappingKey &&
                    match.remainder < 0.01
                ) {
                    await poslovanjService.unlinkTransactionFromPartner(
                        match.transaction.partnerMappingKey,
                    )
                }
                for (const exp of match.expenses) {
                    await poslovanjService.updateExpense(exp.key, {
                        status: 'paid',
                        paymentMethod: 'bank_account',
                        bankAccount: match.transaction.bankAccount,
                        transactionRef: match.transaction.ref,
                        transactionLabel: match.transaction.label,
                    })
                    count++
                }
            }
            toast(`Balanced ${count} expense(s)`, { type: 'success' })
            setBalanceOpen(false)
        } catch (error) {
            toast('Failed to balance some expenses', { type: 'error' })
        } finally {
            setBalancing(false)
        }
    }

    const [itemBalanceOpen, setItemBalanceOpen] = useState(false)
    const [itemBalanceTxns, setItemBalanceTxns] = useState([])
    const [itemBalanceExpense, setItemBalanceExpense] = useState(null)

    const handleAutoBalanceItem = (expense) => {
        const partnerAccounts = bankAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)
        if (
            partnerAccounts.length === 0 &&
            partnerMappedRefs.size === 0
        ) {
            toast('Partner has no bank accounts', { type: 'warning' })
            return
        }

        const consumedByRef = {}
        expenses.forEach((e) => {
            if (e.transactionRef) {
                consumedByRef[e.transactionRef] =
                    (consumedByRef[e.transactionRef] || 0) + (e.amount || 0)
            }
        })

        const matchesPartner = (txAccount) =>
            partnerAccounts.some(
                (pa) => txAccount.includes(pa) || pa.includes(txAccount),
            )

        const candidates = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const ref = `${s.key}::${i}`
                const isMapped = partnerMappedRefs.has(ref)
                if (!isMapped) {
                    const txAccount = normalizeAccount(t.brojRacuna)
                    if (!txAccount || !matchesPartner(txAccount)) return
                }
                if (t.duguje <= 0) return
                const consumed = consumedByRef[ref] || 0
                const available = t.duguje - consumed
                if (available <= 0.01) return
                candidates.push({
                    ref,
                    amount: t.duguje,
                    available,
                    currency: s.valuta || 'RSD',
                    date: t.datumValute,
                    bankAccount: s.partija,
                    description: t.nalogKorisnik || '',
                    opis: t.opis || '',
                    label: `${t.datumValute} | ${fmtNum(t.duguje)} ${s.valuta || 'RSD'} | ${t.nalogKorisnik || ''}${t.opis ? ' - ' + t.opis : ''}`,
                    partnerMappingKey: partnerMappedRefs.get(ref) || null,
                })
            })
        })

        if (candidates.length === 0) {
            toast('No matching bank transaction found', { type: 'info' })
            return
        }

        if (candidates.length === 1) {
            handleItemBalanceConfirm(expense, candidates[0])
            return
        }

        setItemBalanceExpense(expense)
        setItemBalanceTxns(candidates)
        setItemBalanceOpen(true)
    }

    const handleItemBalanceConfirm = async (expense, tx) => {
        try {
            if (tx.partnerMappingKey) {
                const newRemaining =
                    (tx.available || tx.amount) - (expense.amount || 0)
                if (newRemaining < 0.01) {
                    await poslovanjService.unlinkTransactionFromPartner(
                        tx.partnerMappingKey,
                    )
                }
            }
            await poslovanjService.updateExpense(expense.key, {
                status: 'paid',
                paymentMethod: 'bank_account',
                bankAccount: tx.bankAccount,
                transactionRef: tx.ref,
                transactionLabel: tx.label,
            })
            toast('Expense linked', { type: 'success' })
            setItemBalanceOpen(false)
        } catch {
            toast('Failed to link expense', { type: 'error' })
        }
    }

    const [empTxLinkOpen, setEmpTxLinkOpen] = useState(false)
    const [empTxLinkCandidates, setEmpTxLinkCandidates] = useState([])
    const [empTxLinkItem, setEmpTxLinkItem] = useState(null)

    const handleAutoLinkEmpTx = (empTx) => {
        const partnerAccounts = bankAccounts
            .map((a) => normalizeAccount(a.account))
            .filter(Boolean)
        if (partnerAccounts.length === 0 && partnerMappedRefs.size === 0) {
            toast('Partner has no bank accounts', { type: 'warning' })
            return
        }

        const consumedByRef = {}
        employeeTransactions.forEach((t) => {
            if (t.transactionRef) {
                consumedByRef[t.transactionRef] =
                    (consumedByRef[t.transactionRef] || 0) + (t.amount || 0)
            }
        })

        const matchesPartner = (txAccount) =>
            partnerAccounts.some(
                (pa) => txAccount.includes(pa) || pa.includes(txAccount),
            )

        const candidates = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const ref = `${s.key}::${i}`
                const isMapped = partnerMappedRefs.has(ref)
                if (!isMapped) {
                    const txAccount = normalizeAccount(t.brojRacuna)
                    if (!txAccount || !matchesPartner(txAccount)) return
                }
                const isDuguje = t.duguje > 0
                const isPotrazuje = t.potrazuje > 0
                if (!isDuguje && !isPotrazuje) return
                const direction = isDuguje ? 'to' : 'from'
                if (direction !== empTx.direction) return
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
            handleEmpTxLinkConfirm(empTx, candidates[0])
            return
        }

        setEmpTxLinkItem(empTx)
        setEmpTxLinkCandidates(candidates)
        setEmpTxLinkOpen(true)
    }

    const handleEmpTxLinkConfirm = async (empTx, bankEntry) => {
        try {
            if (bankEntry.partnerMappingKey) {
                const newRemaining =
                    (bankEntry.available || bankEntry.amount) - (empTx.amount || 0)
                if (newRemaining < 0.01) {
                    await poslovanjService.unlinkTransactionFromPartner(
                        bankEntry.partnerMappingKey,
                    )
                }
            }
            await poslovanjService.updateEmployeeTransaction(empTx.key, {
                bankAccount: bankEntry.bankAccount,
                transactionRef: bankEntry.ref,
                transactionLabel: bankEntry.label,
            })
            toast('Transaction linked', { type: 'success' })
            setEmpTxLinkOpen(false)
        } catch {
            toast('Failed to link transaction', { type: 'error' })
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

                {/* Summary */}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Credit
                            </Typography>
                            <Tooltip title="Total obligations to this partner" arrow>
                                <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Tooltip>
                        </Box>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ color: '#d32f2f' }}
                        >
                            {fmtNum(totalExpenses)}
                        </Typography>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, flex: '1 1 140px' }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Debit
                            </Typography>
                            <Tooltip title="Total receivables from this partner" arrow>
                                <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Tooltip>
                        </Box>
                        <Typography
                            variant="h6"
                            fontWeight={600}
                            sx={{ color: '#2e7d32' }}
                        >
                            {fmtNum(totalIncome)}
                        </Typography>
                    </Paper>
                    {(bankTotals.debit > 0 || bankTotals.credit > 0) && (
                        <Paper
                            variant="outlined"
                            sx={{ p: 2, flex: '1 1 140px' }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    Bank Transactions
                                </Typography>
                                <Tooltip title="Net bank movement: money received minus money paid out via linked bank statements" arrow>
                                    <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                                </Tooltip>
                            </Box>
                            <Typography
                                variant="h6"
                                fontWeight={600}
                                sx={{
                                    color:
                                        bankTotals.credit - bankTotals.debit >= 0
                                            ? '#2e7d32'
                                            : '#d32f2f',
                                }}
                            >
                                {fmtNum(bankTotals.credit - bankTotals.debit)}
                            </Typography>
                        </Paper>
                    )}
                    <Paper
                        variant="outlined"
                        sx={{ p: 2, flex: '1 1 140px' }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                                Balance
                            </Typography>
                            <Tooltip title="Outstanding balance: positive means we owe them, negative means they owe us" arrow>
                                <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </Tooltip>
                        </Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                color:
                                    balance >= 0
                                        ? '#2e7d32'
                                        : '#d32f2f',
                            }}
                        >
                            {fmtNum(balance)}
                        </Typography>
                    </Paper>
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
                                                <Typography variant="body2">
                                                    {inv.date || '—'}
                                                </Typography>
                                                {inv.linkedStatement && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                        onClick={() => setPreviewStatement(statements.find((s) => s.key === inv.linkedStatement.statementKey))}
                                                    >
                                                        Statement #{inv.linkedStatement.brojIzvoda} &middot; {inv.linkedStatement.datumIzvoda} &middot; {fmtNum(inv.linkedStatement.potrazuje)} {inv.linkedStatement.valuta}
                                                    </Typography>
                                                )}
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

                {/* Mapped transactions section */}
                {resolvedMappedTransactions.length > 0 && (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, mt: 2 }}
                        >
                            Mapped Transactions (
                            {resolvedMappedTransactions.length})
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
                                            <strong>Date</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Payer/Payee</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Description</strong>
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
                                    {resolvedMappedTransactions.map((t) => {
                                        const amount = t.remaining
                                        const isDebit = t.stavka.duguje > 0
                                        return (
                                            <TableRow key={t.key} hover>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {t.stavka.datumValute || '—'}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                        onClick={() => setPreviewStatement(t.statement)}
                                                    >
                                                        Statement #{t.statement.brojIzvoda} &middot; {t.statement.datumIzvoda}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    {t.stavka.nalogKorisnik ||
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {t.stavka.opis || '—'}
                                                </TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: isDebit
                                                            ? '#d32f2f'
                                                            : '#2e7d32',
                                                    }}
                                                >
                                                    {isDebit ? '−' : '+'}
                                                    {fmtNum(amount)}{' '}
                                                    {t.statement.valuta ||
                                                        'RSD'}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleUnlinkTransactionPartner(
                                                                t,
                                                            )
                                                        }
                                                        title="Unlink"
                                                        sx={{
                                                            color: '#d32f2f',
                                                        }}
                                                    >
                                                        <LinkOff fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
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
                                                <TableCell align="center">
                                                    <strong>Actions</strong>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedEmployeeTransactions.map(
                                                (t) => (
                                                    <TableRow
                                                        key={t.key}
                                                        hover
                                                        sx={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            setEditEmpTx(t)
                                                            setEmpTxDialogOpen(true)
                                                        }}
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
                                                            }}
                                                        >
                                                            {fmtNum(
                                                                t.amount,
                                                            )}{' '}
                                                            {t.currency ||
                                                                'RSD'}
                                                        </TableCell>
                                                        <TableCell
                                                            align="center"
                                                            onClick={(ev) => ev.stopPropagation()}
                                                        >
                                                            {!t.transactionRef && (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleAutoLinkEmpTx(t)
                                                                    }
                                                                    title="Auto link"
                                                                >
                                                                    <SyncAlt fontSize="small" />
                                                                </IconButton>
                                                            )}
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={handleAutoBalance}
                            sx={{ textTransform: 'none' }}
                        >
                            Auto Balance
                        </Button>
                        <Button
                            size="small"
                            startIcon={<Add />}
                            onClick={handleNewExpense}
                            sx={{ textTransform: 'none' }}
                        >
                            Add Expense
                        </Button>
                    </Box>
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
                        {sortedExpenses.map((e) => {
                            const tx = expenseTxMap[e.key]
                            return (
                            <Paper
                                key={e.key}
                                variant="outlined"
                                sx={{ mb: 1.5, p: 2, cursor: 'pointer' }}
                                onClick={() => handleEditExpense(e)}
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
                                        {tx && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                display="block"
                                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                onClick={(ev) => { ev.stopPropagation(); setPreviewStatement(statements.find((s) => s.key === tx.stmtKey)) }}
                                            >
                                                Statement #{tx.brojIzvoda} &middot; {tx.date} &middot; {fmtNum(tx.amount)} {tx.currency}
                                            </Typography>
                                        )}
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
                                    <Box onClick={(ev) => ev.stopPropagation()}>
                                        {e.status === 'unpaid' && (
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    handleAutoBalanceItem(e)
                                                }
                                                title="Auto balance"
                                            >
                                                <SyncAlt fontSize="small" />
                                            </IconButton>
                                        )}
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
                                {sortedExpenses.map((e) => {
                                    const tx = expenseTxMap[e.key]
                                    return (
                                    <TableRow
                                        key={e.key}
                                        hover
                                        onClick={() => handleEditExpense(e)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        <TableCell>{e.date}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {e.description || '—'}
                                            </Typography>
                                            {tx && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                    onClick={(ev) => { ev.stopPropagation(); setPreviewStatement(statements.find((s) => s.key === tx.stmtKey)) }}
                                                >
                                                    Statement #{tx.brojIzvoda} &middot; {tx.date} &middot; {fmtNum(tx.amount)} {tx.currency}
                                                </Typography>
                                            )}
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
                                            onClick={(ev) => ev.stopPropagation()}
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
                                            {e.status === 'unpaid' && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleAutoBalanceItem(e)
                                                    }
                                                    title="Auto balance"
                                                >
                                                    <SyncAlt fontSize="small" />
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
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Government Expenses section */}
                {partnerGovExpenses.length > 0 && (
                    <>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, mt: 3 }}
                        >
                            Government Expenses ({partnerGovExpenses.length})
                        </Typography>
                        {isMobile ? (
                            <>
                                {partnerGovExpenses.map((e) => {
                                    const tx = govExpTxMap[e.key]
                                    return (
                                        <Paper
                                            key={e.key}
                                            variant="outlined"
                                            sx={{ mb: 1.5, p: 2, cursor: 'pointer' }}
                                            onClick={() => {
                                                setEditGovExp(e)
                                                setGovExpDialogOpen(true)
                                            }}
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
                                                    {tx && (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            display="block"
                                                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                            onClick={(ev) => { ev.stopPropagation(); setPreviewStatement(statements.find((s) => s.key === tx.stmtKey)) }}
                                                        >
                                                            Statement #{tx.brojIzvoda} &middot; {tx.date} &middot; {fmtNum(tx.amount)} {tx.currency}
                                                        </Typography>
                                                    )}
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
                                                <Chip
                                                    label={e.status === 'unpaid' ? 'Unpaid' : 'Paid'}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        borderColor: e.status === 'unpaid' ? '#ed6c02' : '#2e7d32',
                                                        color: e.status === 'unpaid' ? '#ed6c02' : '#2e7d32',
                                                    }}
                                                />
                                            </Box>
                                        </Paper>
                                    )
                                })}
                            </>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                            <TableCell><strong>Date</strong></TableCell>
                                            <TableCell><strong>Description</strong></TableCell>
                                            <TableCell align="right"><strong>Amount</strong></TableCell>
                                            <TableCell><strong>Status</strong></TableCell>
                                            <TableCell><strong>Payment</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {partnerGovExpenses.map((e) => {
                                            const tx = govExpTxMap[e.key]
                                            return (
                                                <TableRow
                                                    key={e.key}
                                                    hover
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                        setEditGovExp(e)
                                                        setGovExpDialogOpen(true)
                                                    }}
                                                >
                                                    <TableCell>{e.date}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {e.description || '—'}
                                                        </Typography>
                                                        {tx && (
                                                            <Typography
                                                                variant="caption"
                                                                color="text.secondary"
                                                                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                                                onClick={(ev) => { ev.stopPropagation(); setPreviewStatement(statements.find((s) => s.key === tx.stmtKey)) }}
                                                            >
                                                                Statement #{tx.brojIzvoda} &middot; {tx.date} &middot; {fmtNum(tx.amount)} {tx.currency}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                                        {fmtNum(e.amount)} {e.currency || 'RSD'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={e.status === 'unpaid' ? 'Unpaid' : 'Paid'}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{
                                                                borderColor: e.status === 'unpaid' ? '#ed6c02' : '#2e7d32',
                                                                color: e.status === 'unpaid' ? '#ed6c02' : '#2e7d32',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {e.status !== 'unpaid' && e.paymentMethod
                                                            ? <Chip label={PAYMENT_LABELS[e.paymentMethod] || e.paymentMethod} size="small" variant="outlined" />
                                                            : '—'}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </>
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
                allExpenses={allExpenses}
            />

            <StatementPreview
                isOpen={!!previewStatement}
                onClose={() => setPreviewStatement(null)}
                statement={previewStatement}
                linkedByExpenses={linkedByExpenses}
                linkedByInvoices={linkedByInvoices}
                linkedByPartners={linkedByPartners}
                partners={allPartners}
            />

            <EmployeeTransactionDialog
                isOpen={empTxDialogOpen}
                onClose={() => setEmpTxDialogOpen(false)}
                transaction={editEmpTx}
                employeeKey={editEmpTx?.employeeKey}
                accounts={accounts}
                statements={statements}
            />

            <GovernmentExpenseDialog
                isOpen={govExpDialogOpen}
                onClose={() => setGovExpDialogOpen(false)}
                expense={editGovExp}
                partners={allPartners}
                accounts={accounts}
                statements={statements}
                defaultPartnerKey={partner.key}
            />

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
                    {balancing && <LinearProgress sx={{ mb: 1 }} />}
                    {balanceMatches.map((match, mi) => (
                        <Paper
                            key={mi}
                            variant="outlined"
                            sx={{
                                mb: 2,
                                p: 2,
                                opacity: balanceSelected.has(mi) ? 1 : 0.5,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 1.5,
                                }}
                            >
                                <Checkbox
                                    checked={balanceSelected.has(mi)}
                                    onChange={() => handleBalanceToggle(mi)}
                                />
                                <Box sx={{ flex: 1 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={600}
                                    >
                                        Bank Transaction:{' '}
                                        {fmtNum(match.transaction.amount)}{' '}
                                        {match.transaction.currency}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        {match.transaction.date}
                                        {match.transaction.description
                                            ? ` · ${match.transaction.description}`
                                            : ''}
                                        {match.transaction.opis
                                            ? ` - ${match.transaction.opis}`
                                            : ''}
                                    </Typography>
                                </Box>
                            </Box>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell>
                                            <strong>Expense</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Date</strong>
                                        </TableCell>
                                        <TableCell align="right">
                                            <strong>Amount</strong>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {match.expenses.map((exp) => (
                                        <TableRow key={exp.key}>
                                            <TableCell>
                                                {exp.description || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {exp.date || '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontWeight: 500 }}
                                            >
                                                {fmtNum(exp.amount)}{' '}
                                                {exp.currency || 'RSD'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow>
                                        <TableCell
                                            colSpan={2}
                                            sx={{ fontWeight: 600 }}
                                        >
                                            Total matched
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ fontWeight: 600 }}
                                        >
                                            {fmtNum(match.totalExpenses)}{' '}
                                            {match.transaction.currency}
                                        </TableCell>
                                    </TableRow>
                                    {match.remainder > 0.01 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={2}
                                                sx={{ color: '#ed6c02' }}
                                            >
                                                Unmatched remainder
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: '#ed6c02',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                {fmtNum(match.remainder)}{' '}
                                                {match.transaction.currency}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Paper>
                    ))}
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
                        disabled={balancing || balanceSelected.size === 0}
                        sx={{ textTransform: 'none' }}
                    >
                        {balancing
                            ? 'Balancing...'
                            : `Confirm ${balanceMatches
                                  .filter((_, i) => balanceSelected.has(i))
                                  .reduce(
                                      (sum, m) => sum + m.expenses.length,
                                      0,
                                  )} Expense(s)`}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={itemBalanceOpen}
                onClose={() => setItemBalanceOpen(false)}
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
                        {itemBalanceExpense && (
                            <Typography variant="body2" color="text.secondary">
                                {itemBalanceExpense.description} &mdash;{' '}
                                {fmtNum(itemBalanceExpense.amount)}{' '}
                                {itemBalanceExpense.currency || 'RSD'}
                            </Typography>
                        )}
                    </Box>
                    <IconButton
                        onClick={() => setItemBalanceOpen(false)}
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
                            {itemBalanceTxns.map((tx) => (
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
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                                        {itemBalanceExpense &&
                                        Math.abs(tx.amount - (itemBalanceExpense.amount || 0)) > 0.01 ? (
                                            <>
                                                {fmtNum(itemBalanceExpense.amount)}{' '}
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
                                                handleItemBalanceConfirm(
                                                    itemBalanceExpense,
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

            <Dialog
                open={empTxLinkOpen}
                onClose={() => setEmpTxLinkOpen(false)}
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
                        {empTxLinkItem && (
                            <Typography variant="body2" color="text.secondary">
                                {empTxLinkItem.description || '—'} &mdash;{' '}
                                {fmtNum(empTxLinkItem.amount)}{' '}
                                {empTxLinkItem.currency || 'RSD'}
                            </Typography>
                        )}
                    </Box>
                    <IconButton
                        onClick={() => setEmpTxLinkOpen(false)}
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
                            {empTxLinkCandidates.map((tx) => (
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
                                        {empTxLinkItem &&
                                        Math.abs(tx.amount - (empTxLinkItem.amount || 0)) > 0.01 ? (
                                            <>
                                                {fmtNum(empTxLinkItem.amount)}{' '}
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
                                                handleEmpTxLinkConfirm(
                                                    empTxLinkItem,
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
