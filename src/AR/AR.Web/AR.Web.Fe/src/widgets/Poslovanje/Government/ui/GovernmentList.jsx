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
    Visibility,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { GovernmentExpenseDialog } from './GovernmentExpenseDialog'
import { GovernmentDetail } from './GovernmentDetail'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

export const GovernmentList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [partners, setPartners] = useState([])
    const [expenses, setExpenses] = useState([])
    const [statements, setStatements] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editExpense, setEditExpense] = useState(null)
    const [viewPartnerKey, setViewPartnerKey] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onPartners(setPartners)
        const unsub2 = poslovanjService.onGovernmentExpenses(setExpenses)
        const unsub3 = poslovanjService.onStatements(setStatements)
        return () => {
            unsub1()
            unsub2()
            unsub3()
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

    // Partners that have government expenses
    const governmentPartners = useMemo(() => {
        const partnerKeys = new Set(expenses.map((e) => e.partnerKey))
        return partners.filter((p) => partnerKeys.has(p.key))
    }, [partners, expenses])

    const partnerStats = useMemo(() => {
        const map = {}
        expenses.forEach((e) => {
            if (!map[e.partnerKey]) {
                map[e.partnerKey] = { count: 0, paid: 0, unpaid: 0 }
            }
            map[e.partnerKey].count++
            if (e.status === 'unpaid') {
                map[e.partnerKey].unpaid += e.amount || 0
            } else {
                map[e.partnerKey].paid += e.amount || 0
            }
        })
        return map
    }, [expenses])

    const handleNew = () => {
        setEditExpense(null)
        setDialogOpen(true)
    }

    if (!isAdmin) return null

    const viewPartner = viewPartnerKey
        ? partners.find((p) => p.key === viewPartnerKey)
        : null

    if (viewPartner) {
        return (
            <GovernmentDetail
                partner={viewPartner}
                expenses={expenses.filter(
                    (e) => e.partnerKey === viewPartner.key,
                )}
                statements={statements}
                accounts={accounts}
                allPartners={partners}
                onBack={() => setViewPartnerKey(null)}
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
                            Government
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

                {isMobile ? (
                    <>
                        {governmentPartners.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No government expenses yet
                            </Paper>
                        )}
                        {governmentPartners.map((p) => {
                            const stats = partnerStats[p.key] || {}
                            return (
                                <Paper
                                    key={p.key}
                                    variant="outlined"
                                    sx={{
                                        mb: 1.5,
                                        p: 2,
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setViewPartnerKey(p.key)}
                                >
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            mb: 0.5,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            {p.name}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {stats.count || 0} item(s)
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {stats.paid > 0 && (
                                            <Chip
                                                label={`Paid: ${fmtNum(stats.paid)}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    color: '#2e7d32',
                                                    borderColor: '#2e7d32',
                                                }}
                                            />
                                        )}
                                        {stats.unpaid > 0 && (
                                            <Chip
                                                label={`Unpaid: ${fmtNum(stats.unpaid)}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    color: '#ed6c02',
                                                    borderColor: '#ed6c02',
                                                }}
                                            />
                                        )}
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
                                        <strong>Government Body</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Items</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Paid</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Unpaid</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <strong>Actions</strong>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {governmentPartners.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            No government expenses yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {governmentPartners.map((p) => {
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
                                            <TableCell align="center">
                                                {stats.count || 0}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: '#2e7d32',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {stats.paid > 0
                                                    ? fmtNum(stats.paid)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: '#ed6c02',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {stats.unpaid > 0
                                                    ? fmtNum(stats.unpaid)
                                                    : '—'}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        setViewPartnerKey(
                                                            p.key,
                                                        )
                                                    }
                                                    title="View"
                                                >
                                                    <Visibility fontSize="small" />
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

            <GovernmentExpenseDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                expense={editExpense}
                partners={partners.filter((p) => p.isGovernment)}
                accounts={accounts}
                statements={statements}
            />
        </Grid>
    )
}
