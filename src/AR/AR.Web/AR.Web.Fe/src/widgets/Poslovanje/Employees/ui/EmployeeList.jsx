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
    ContentCopy,
    Delete,
    Edit,
    Visibility,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { EmployeeDialog } from './EmployeeDialog'
import { EmployeeDetail } from './EmployeeDetail'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

export const EmployeeList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [employees, setEmployees] = useState([])
    const [transactions, setTransactions] = useState([])
    const [statements, setStatements] = useState([])
    const [partners, setPartners] = useState([])
    const [transactionPartners, setTransactionPartners] = useState([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editEmployee, setEditEmployee] = useState(null)
    const [viewEmployee, setViewEmployee] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onEmployees(setEmployees)
        const unsub2 = poslovanjService.onEmployeeTransactions(setTransactions)
        const unsub3 = poslovanjService.onStatements(setStatements)
        const unsub4 = poslovanjService.onPartners(setPartners)
        const unsub5 = poslovanjService.onTransactionPartners(setTransactionPartners)
        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
            unsub5()
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

    const employeeSummaries = useMemo(() => {
        const map = {}
        employees.forEach((e) => {
            map[e.key] = { toEmployee: 0, fromEmployee: 0 }
        })
        transactions.forEach((t) => {
            if (!map[t.employeeKey]) return
            const amount = t.amount || 0
            if (t.direction === 'to') {
                map[t.employeeKey].toEmployee += amount
            } else {
                map[t.employeeKey].fromEmployee += amount
            }
        })
        return map
    }, [employees, transactions])

    const partnerMap = useMemo(() => {
        const map = {}
        partners.forEach((p) => {
            map[p.key] = p.name
        })
        return map
    }, [partners])

    const handleDelete = async (employee) => {
        if (!confirm(`Delete employee "${employee.name}"?`)) return
        try {
            await poslovanjService.deleteEmployee(employee.key)
            toast('Employee deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const handleNew = () => {
        setEditEmployee(null)
        setDialogOpen(true)
    }

    const handleEdit = (employee) => {
        setEditEmployee(employee)
        setDialogOpen(true)
    }

    const handleClone = async (employee) => {
        const { key, createdAt, updatedAt, ...data } = employee
        try {
            await poslovanjService.createEmployee({
                ...data,
                name: `${data.name} (copy)`,
            })
            toast('Employee cloned', { type: 'success' })
        } catch (error) {
            toast('Failed to clone', { type: 'error' })
        }
    }

    if (!isAdmin) return null

    if (viewEmployee) {
        return (
            <EmployeeDetail
                employee={viewEmployee}
                partner={partners.find(
                    (p) => p.key === viewEmployee.partnerKey,
                )}
                transactions={transactions.filter(
                    (t) => t.employeeKey === viewEmployee.key,
                )}
                statements={statements}
                accounts={accounts}
                transactionPartners={transactionPartners.filter(
                    (tp) => tp.partnerKey === viewEmployee.partnerKey,
                )}
                onBack={() => setViewEmployee(null)}
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
                            Employees
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleNew}
                        size={isMobile ? 'small' : 'medium'}
                        sx={{ textTransform: 'none' }}
                    >
                        {isMobile ? 'New' : 'New Employee'}
                    </Button>
                </Box>

                {isMobile ? (
                    <>
                        {employees.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No employees yet
                            </Paper>
                        )}
                        {employees.map((e) => {
                            const summary = employeeSummaries[e.key] || {}
                            return (
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
                                                {e.name}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {[
                                                    e.position,
                                                    partnerMap[e.partnerKey],
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') || ''}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            gap: 1,
                                            flexWrap: 'wrap',
                                            mb: 1,
                                        }}
                                    >
                                        {summary.toEmployee > 0 && (
                                            <Chip
                                                label={`Paid: ${fmtNum(summary.toEmployee)} RSD`}
                                                size="small"
                                                sx={{
                                                    color: '#d32f2f',
                                                    borderColor: '#d32f2f',
                                                }}
                                                variant="outlined"
                                            />
                                        )}
                                        {summary.fromEmployee > 0 && (
                                            <Chip
                                                label={`Received: ${fmtNum(summary.fromEmployee)} RSD`}
                                                size="small"
                                                sx={{
                                                    color: '#2e7d32',
                                                    borderColor: '#2e7d32',
                                                }}
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
                                            onClick={() => setViewEmployee(e)}
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
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
                                        <strong>Position</strong>
                                    </TableCell>
                                    <TableCell>
                                        <strong>Partner</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Paid Out</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>Received</strong>
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
                                {employees.length === 0 && (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            align="center"
                                            sx={{
                                                py: 4,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            No employees yet
                                        </TableCell>
                                    </TableRow>
                                )}
                                {employees.map((e) => {
                                    const summary =
                                        employeeSummaries[e.key] || {}
                                    const balance =
                                        (summary.toEmployee || 0) -
                                        (summary.fromEmployee || 0)
                                    return (
                                        <TableRow key={e.key} hover>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={500}
                                                >
                                                    {e.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {e.position || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {partnerMap[e.partnerKey] || '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ color: '#d32f2f' }}
                                            >
                                                {summary.toEmployee > 0
                                                    ? fmtNum(
                                                          summary.toEmployee,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{ color: '#2e7d32' }}
                                            >
                                                {summary.fromEmployee > 0
                                                    ? fmtNum(
                                                          summary.fromEmployee,
                                                      )
                                                    : '—'}
                                            </TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    fontWeight: 600,
                                                    color:
                                                        balance > 0
                                                            ? '#d32f2f'
                                                            : balance < 0
                                                              ? '#2e7d32'
                                                              : undefined,
                                                }}
                                            >
                                                {fmtNum(balance)}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ whiteSpace: 'nowrap' }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        setViewEmployee(e)
                                                    }
                                                    title="View"
                                                >
                                                    <Visibility fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleEdit(e)
                                                    }
                                                    title="Edit"
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleClone(e)
                                                    }
                                                    title="Clone"
                                                >
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleDelete(e)
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

            <EmployeeDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                employee={editEmployee}
                partners={partners}
            />
        </Grid>
    )
}
