import { useAuth } from '@/app/context/AuthContext'
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
    Delete,
    Edit,
    Visibility,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { PartnerDialog } from './PartnerDialog'
import { PartnerDetail } from './PartnerDetail'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

export const PartnerList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [partners, setPartners] = useState([])
    const [invoices, setInvoices] = useState([])
    const [expenses, setExpenses] = useState([])
    const [statements, setStatements] = useState([])
    const [employees, setEmployees] = useState([])
    const [employeeTransactions, setEmployeeTransactions] = useState([])
    const [transactionPartners, setTransactionPartners] = useState([])
    const [governmentExpenses, setGovernmentExpenses] = useState([])
    const [forexExchanges, setForexExchanges] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editPartner, setEditPartner] = useState(null)
    const [viewPartnerKey, setViewPartnerKey] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onPartners(setPartners)
        const unsub2 = poslovanjService.onInvoices(setInvoices)
        const unsub3 = poslovanjService.onExpenses(setExpenses)
        const unsub4 = poslovanjService.onStatements(setStatements)
        const unsub5 = poslovanjService.onEmployees(setEmployees)
        const unsub6 =
            poslovanjService.onEmployeeTransactions(setEmployeeTransactions)
        const unsub7 = poslovanjService.onTransactionPartners(
            setTransactionPartners,
        )
        const unsub8 = poslovanjService.onGovernmentExpenses(
            setGovernmentExpenses,
        )
        const unsub9 = poslovanjService.onForexExchanges(setForexExchanges)
        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
            unsub5()
            unsub6()
            unsub7()
            unsub8()
            unsub9()
        }
    }, [])

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

    const partnerStats = useMemo(() => {
        const map = {}
        partners.forEach((p) => {
            map[p.key] = { invoiceCount: 0, expenseCount: 0, expenseTotal: 0 }
        })
        invoices.forEach((inv) => {
            if (inv.receiverId && map[inv.receiverId]) {
                map[inv.receiverId].invoiceCount++
            }
        })
        expenses.forEach((exp) => {
            if (exp.partnerKey && map[exp.partnerKey]) {
                map[exp.partnerKey].expenseCount++
                map[exp.partnerKey].expenseTotal += exp.amount || 0
            }
        })
        governmentExpenses.forEach((exp) => {
            if (exp.partnerKey && map[exp.partnerKey]) {
                map[exp.partnerKey].expenseCount++
                map[exp.partnerKey].expenseTotal += exp.amount || 0
            }
        })
        const empPartnerMap = {}
        employees.forEach((e) => {
            if (e.partnerKey) empPartnerMap[e.key] = e.partnerKey
        })
        employeeTransactions.forEach((t) => {
            if (t.direction !== 'to') return
            const pk = empPartnerMap[t.employeeKey]
            if (pk && map[pk]) {
                map[pk].expenseCount++
                map[pk].expenseTotal += t.amount || 0
            }
        })
        return map
    }, [partners, invoices, expenses, governmentExpenses, employees, employeeTransactions])

    const handleDelete = async (partner) => {
        if (!confirm(`Delete partner "${partner.name}"?`)) return
        try {
            await poslovanjService.deletePartner(partner.key)
            toast('Partner deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleNew = () => {
        setEditPartner(null)
        setDialogOpen(true)
    }

    const handleEdit = (partner) => {
        setEditPartner(partner)
        setDialogOpen(true)
    }

    if (!isAdmin) return null

    const viewPartner = viewPartnerKey
        ? partners.find((p) => p.key === viewPartnerKey)
        : null

    if (viewPartner) {
        return (
            <PartnerDetail
                partner={viewPartner}
                invoices={invoices.filter(
                    (i) => i.receiverId === viewPartner.key,
                )}
                expenses={expenses.filter(
                    (e) => e.partnerKey === viewPartner.key,
                )}
                employees={employees.filter(
                    (e) => e.partnerKey === viewPartner.key,
                )}
                employeeTransactions={employeeTransactions.filter((t) =>
                    employees.some(
                        (e) =>
                            e.partnerKey === viewPartner.key &&
                            e.key === t.employeeKey,
                    ),
                )}
                transactionPartners={transactionPartners.filter(
                    (tp) => tp.partnerKey === viewPartner.key,
                )}
                statements={statements}
                accounts={accounts}
                allPartners={partners}
                allExpenses={expenses}
                allInvoices={invoices}
                allTransactionPartners={transactionPartners}
                governmentExpenses={governmentExpenses}
                forexExchanges={forexExchanges}
                onBack={() => setViewPartnerKey(null)}
                onEditPartner={() => handleEdit(viewPartner)}
            />
        )
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
                            Partners
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleNew}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ textTransform: 'none' }}
                    >
                        {isMobile ? 'New' : 'New Partner'}
                    </Button>
                </Box>

                {isMobile ? (
                    <>
                        {partners.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No partners yet
                            </Paper>
                        )}
                        {partners.map((p) => {
                            const stats = partnerStats[p.key] || {}
                            return (
                                <Paper
                                    key={p.key}
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
                                                {p.name}
                                            </Typography>
                                            {p.taxId && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {p.taxId}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            flexWrap: 'wrap',
                                            mb: 1,
                                        }}
                                    >
                                        {stats.invoiceCount > 0 && (
                                            <Chip
                                                label={`${stats.invoiceCount} invoice(s)`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        {stats.expenseCount > 0 && (
                                            <Chip
                                                label={`${stats.expenseCount} expense(s)`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: 0.5,
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() =>
                                                setViewPartnerKey(p.key)
                                            }
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(p)}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(p)}
                                            sx={{ color: '#d32f2f' }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
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
                                        <strong>Name</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Tax ID</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Invoices</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Expenses</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Expense Total</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Actions</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {partners.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={6}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            No partners yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {partners.map((p) => {
                                    const stats = partnerStats[p.key] || {}
                                    return (
                                        <TableRow key={p.key} hover>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                >
                                                    {p.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {p.taxId || '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                {stats.invoiceCount || '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                {stats.expenseCount || '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {stats.expenseTotal > 0
                                                    ? fmtNum(
                                                          stats.expenseTotal,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ whiteSpace: 'nowrap' }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        setViewPartnerKey(p.key)
                                                    }
                                                    title="View"
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleEdit(p)
                                                    }
                                                    title="Edit"
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleDelete(p)
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
            </Grid>

            <PartnerDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                partner={editPartner}
            />
        </Grid>
    )
}
