import { useAuth } from '@/app/context/AuthContext'
import { poslovanjService } from '@/app/services/poslovanjService'
import { renderTemplate } from '../../utils/templateEngine'
import {
    Box,
    Button,
    Chip,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { Add, Edit, Delete, Print, ArrowBack, ContentCopy, Undo, AttachFile, Link as LinkIcon, CheckCircle } from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { InvoiceEditorModal } from '../../InvoiceEditor/ui/InvoiceEditorModal'
import { AttachmentsDialog } from '../../Attachments/ui/AttachmentsDialog'
import { StatementLinkDialog } from './StatementLinkDialog'

const statusStyles = {
    draft: {},
    sent: { bgcolor: '#000', color: '#fff' },
    paid: { bgcolor: '#2e7d32', color: '#fff' },
}

export const InvoiceList = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const [invoices, setInvoices] = useState([])
    const [receivers, setReceivers] = useState([])
    const [templates, setTemplates] = useState([])
    const [provider, setProvider] = useState(null)
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [editingInvoice, setEditingInvoice] = useState(null)
    const [editorMode, setEditorMode] = useState('create')
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
    const [filterStatus, setFilterStatus] = useState('')
    const [filterReceiver, setFilterReceiver] = useState('')
    const [filterSearch, setFilterSearch] = useState('')
    const [sortField, setSortField] = useState('date')
    const [sortDir, setSortDir] = useState('desc')
    const [attachmentsInvoice, setAttachmentsInvoice] = useState(null)
    const [statements, setStatements] = useState([])
    const [linkInvoice, setLinkInvoice] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onInvoices(setInvoices)
        const unsub2 = poslovanjService.onReceivers(setReceivers)
        const unsub3 = poslovanjService.onTemplates(setTemplates)
        const unsub4 = poslovanjService.onProvider(setProvider)
        const unsub5 = poslovanjService.onStatements(setStatements)
        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
            unsub5()
        }
    }, [])

    const receiverMap = Object.fromEntries(
        receivers.map((r) => [r.key, r]),
    )

    const getReceiver = (inv) => {
        const isFinal = (inv.status === 'sent' || inv.status === 'paid') && inv.receiverSnapshot
        return isFinal ? inv.receiverSnapshot : receiverMap[inv.receiverId]
    }

    const handleCreate = () => {
        setEditingInvoice(null)
        setEditorMode('create')
        setIsEditorOpen(true)
    }

    const handleEdit = (invoice) => {
        setEditingInvoice(invoice)
        setEditorMode('edit')
        setIsEditorOpen(true)
    }

    const handleClone = async (invoice) => {
        const { key, createdAt, updatedAt, attachments, linkedStatement, ...data } = invoice
        try {
            await poslovanjService.createInvoice({
                ...data,
                invoiceNumber: `${invoice.invoiceNumber}-copy`,
                status: 'draft',
            })
            toast('Invoice cloned', { type: 'success' })
        } catch (error) {
            toast('Failed to clone', { type: 'error' })
        }
    }

    const handleRevertToDraft = async (invoice) => {
        if (!confirm(`Revert invoice ${invoice.invoiceNumber} to draft?`)) return
        try {
            await poslovanjService.updateInvoice(invoice.key, {
                status: 'draft',
                receiverSnapshot: null,
                providerSnapshot: null,
                templateSnapshot: null,
            })
            toast('Invoice reverted to draft', { type: 'success' })
        } catch (error) {
            toast('Failed to revert', { type: 'error' })
        }
    }

    const handleMarkPaid = async (invoice) => {
        try {
            await poslovanjService.updateInvoice(invoice.key, { status: 'paid' })
            toast('Invoice marked as paid', { type: 'success' })
        } catch (error) {
            toast('Failed to update status', { type: 'error' })
        }
    }

    const handleDelete = async (invoice) => {
        if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return
        try {
            await poslovanjService.deleteInvoice(invoice.key)
            toast('Invoice deleted', { type: 'success' })
        } catch (error) {
            toast('Failed to delete', { type: 'error' })
        }
    }

    const normalizeItems = (items) => {
        if (!items) return []
        if (Array.isArray(items)) return items
        return Object.values(items)
    }

    const handlePrint = (invoice) => {
        const isFinal = invoice.status === 'sent' || invoice.status === 'paid'
        const hasSnapshot = invoice.receiverSnapshot && invoice.templateSnapshot

        const liveReceiver = receiverMap[invoice.receiverId]
        const receiver = (isFinal && hasSnapshot)
            ? invoice.receiverSnapshot
            : liveReceiver
        if (!receiver) {
            toast('Receiver not found', { type: 'error' })
            return
        }

        let templateHtml
        if (isFinal && hasSnapshot) {
            templateHtml = invoice.templateSnapshot
        } else {
            if (!receiver.templateId) {
                toast(
                    'No template assigned to this receiver. Go to Settings to assign one.',
                    { type: 'warning' },
                )
                return
            }
            const template = templates.find((t) => t.key === receiver.templateId)
            if (!template) {
                toast('Template not found', { type: 'error' })
                return
            }
            templateHtml = template.htmlContent
        }

        const printProvider = (isFinal && hasSnapshot)
            ? invoice.providerSnapshot
            : provider || {}

        if (isFinal && !hasSnapshot && liveReceiver) {
            const { key, ...receiverData } = liveReceiver
            const snapshotData = {
                receiverSnapshot: receiverData,
                providerSnapshot: provider || {},
                templateSnapshot: templateHtml,
            }
            poslovanjService.updateInvoice(invoice.key, snapshotData)
        }

        const items = normalizeItems(invoice.items)
        const prefix = receiver.invoicePrefix || ''
        const context = {
            invoice: {
                ...invoice,
                fullNumber: prefix + invoice.invoiceNumber,
                items: items.map((item) => ({
                    ...item,
                    amountFormatted: parseFloat(item.amount).toLocaleString(
                        'en-US',
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        },
                    ),
                })),
                totalFormatted: (invoice.totalAmount || 0).toLocaleString(
                    'en-US',
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    },
                ),
            },
            receiver,
            provider: printProvider,
        }

        const fullNumber = prefix + invoice.invoiceNumber
        const printCss = `<style>@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}table,th,td{border-width:1.5pt!important}}</style>`
        let html = renderTemplate(templateHtml, context)
        html = html.replace(/<title>[^<]*<\/title>/, `<title>Invoice ${fullNumber}</title>`)
        if (html.includes('</head>')) {
            html = html.replace('</head>', printCss + '</head>')
        } else {
            html = printCss + html
        }
        const printWindow = window.open('', '_blank')
        printWindow.document.write(html)
        printWindow.document.close()
        setTimeout(() => printWindow.print(), 300)
    }

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortDir('asc')
        }
    }

    const availableYears = useMemo(() => {
        const years = new Set()
        invoices.forEach((inv) => {
            if (inv.date) {
                const d = new Date(inv.date)
                if (!isNaN(d)) years.add(String(d.getFullYear()))
            }
        })
        return [...years].sort().reverse()
    }, [invoices])

    const sorted = useMemo(() => {
        let list = [...invoices]

        if (filterYear) {
            list = list.filter((inv) => {
                if (!inv.date) return false
                const d = new Date(inv.date)
                return !isNaN(d) && String(d.getFullYear()) === filterYear
            })
        }
        if (filterStatus) {
            list = list.filter((inv) => (inv.status || 'draft') === filterStatus)
        }
        if (filterReceiver) {
            list = list.filter((inv) => inv.receiverId === filterReceiver)
        }
        if (filterSearch) {
            const q = filterSearch.toLowerCase()
            list = list.filter((inv) => {
                const r = getReceiver(inv)
                const fullNum = (r?.invoicePrefix || '') + inv.invoiceNumber
                return (
                    fullNum.toLowerCase().includes(q) ||
                    (r?.name || '').toLowerCase().includes(q) ||
                    (inv.date || '').toLowerCase().includes(q)
                )
            })
        }

        list.sort((a, b) => {
            const dir = sortDir === 'asc' ? 1 : -1
            switch (sortField) {
                case 'invoiceNumber': {
                    const aNum = (getReceiver(a)?.invoicePrefix || '') + a.invoiceNumber
                    const bNum = (getReceiver(b)?.invoicePrefix || '') + b.invoiceNumber
                    return dir * aNum.localeCompare(bNum)
                }
                case 'date': {
                    const aTime = a.date ? new Date(a.date).getTime() : 0
                    const bTime = b.date ? new Date(b.date).getTime() : 0
                    return dir * (aTime - bTime)
                }
                case 'receiver': {
                    const aName = getReceiver(a)?.name || ''
                    const bName = getReceiver(b)?.name || ''
                    return dir * aName.localeCompare(bName)
                }
                case 'amount':
                    return dir * ((a.totalAmount || 0) - (b.totalAmount || 0))
                case 'status':
                    return dir * (a.status || 'draft').localeCompare(b.status || 'draft')
                case 'createdAt':
                default:
                    return dir * ((a.createdAt || 0) - (b.createdAt || 0))
            }
        })

        return list
    }, [invoices, filterYear, filterStatus, filterReceiver, filterSearch, sortField, sortDir, receivers])

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            onClick={() => router.push('/poslovanje')}
                            size="small"
                        >
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h5" fontWeight={600}>
                            Invoices
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreate}
                        sx={{ textTransform: 'none' }}
                    >
                        New Invoice
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Year</InputLabel>
                        <Select
                            value={filterYear}
                            label="Year"
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {availableYears.map((y) => (
                                <MenuItem key={y} value={y}>
                                    {y}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        size="small"
                        placeholder="Search..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        sx={{ minWidth: 180 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Receiver</InputLabel>
                        <Select
                            value={filterReceiver}
                            label="Receiver"
                            onChange={(e) => setFilterReceiver(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {receivers.map((r) => (
                                <MenuItem key={r.key} value={r.key}>
                                    {r.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filterStatus}
                            label="Status"
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="sent">Sent</MenuItem>
                            <MenuItem value="paid">Paid</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sortDirection={sortField === 'invoiceNumber' ? sortDir : false}>
                                    <TableSortLabel
                                        active={sortField === 'invoiceNumber'}
                                        direction={sortField === 'invoiceNumber' ? sortDir : 'asc'}
                                        onClick={() => handleSort('invoiceNumber')}
                                    >
                                        Invoice #
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'date' ? sortDir : false}>
                                    <TableSortLabel
                                        active={sortField === 'date'}
                                        direction={sortField === 'date' ? sortDir : 'asc'}
                                        onClick={() => handleSort('date')}
                                    >
                                        Date
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'receiver' ? sortDir : false}>
                                    <TableSortLabel
                                        active={sortField === 'receiver'}
                                        direction={sortField === 'receiver' ? sortDir : 'asc'}
                                        onClick={() => handleSort('receiver')}
                                    >
                                        Receiver
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sortDirection={sortField === 'amount' ? sortDir : false}>
                                    <TableSortLabel
                                        active={sortField === 'amount'}
                                        direction={sortField === 'amount' ? sortDir : 'asc'}
                                        onClick={() => handleSort('amount')}
                                    >
                                        Amount
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sortDirection={sortField === 'status' ? sortDir : false}>
                                    <TableSortLabel
                                        active={sortField === 'status'}
                                        direction={sortField === 'status' ? sortDir : 'asc'}
                                        onClick={() => handleSort('status')}
                                    >
                                        Status
                                    </TableSortLabel>
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
                                        sx={{ py: 4, color: 'text.secondary' }}
                                    >
                                        No invoices yet
                                    </TableCell>
                                </TableRow>
                            )}
                            {sorted.map((inv) => (
                                <TableRow key={inv.key} hover>
                                    <TableCell>{(getReceiver(inv)?.invoicePrefix || '') + inv.invoiceNumber}</TableCell>
                                    <TableCell>{inv.date}</TableCell>
                                    <TableCell>
                                        {getReceiver(inv)?.name || 'Unknown'}
                                    </TableCell>
                                    <TableCell align="right">
                                        {(
                                            inv.totalAmount || 0
                                        ).toLocaleString()}{' '}
                                        {inv.currency}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={inv.status || 'draft'}
                                            size="small"
                                            sx={statusStyles[inv.status] || {}}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        {(!inv.status || inv.status === 'draft') ? (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEdit(inv)}
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        ) : (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRevertToDraft(inv)}
                                                    title="Revert to Draft"
                                                >
                                                    <Undo fontSize="small" />
                                                </IconButton>
                                                {inv.status === 'sent' && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleMarkPaid(inv)}
                                                        title="Mark as Paid"
                                                        sx={{ color: '#2e7d32' }}
                                                    >
                                                        <CheckCircle fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </>
                                        )}
                                        <IconButton
                                            size="small"
                                            onClick={() => handleClone(inv)}
                                            title="Clone"
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handlePrint(inv)}
                                            title="Print"
                                        >
                                            <Print fontSize="small" />
                                        </IconButton>
                                        {(inv.status === 'sent' || inv.status === 'paid') && (
                                            <IconButton
                                                size="small"
                                                onClick={() => setAttachmentsInvoice(inv)}
                                                title="Attachments"
                                                sx={inv.attachments ? { color: '#2e7d32' } : {}}
                                            >
                                                <AttachFile fontSize="small" />
                                            </IconButton>
                                        )}
                                        {(inv.status === 'sent' || inv.status === 'paid') && (
                                            <Tooltip
                                                title={
                                                    inv.linkedStatement
                                                        ? `Linked: Statement #${inv.linkedStatement.brojIzvoda} (${inv.linkedStatement.datumIzvoda})`
                                                        : 'Link to bank statement'
                                                }
                                                arrow
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setLinkInvoice(inv)}
                                                    sx={inv.linkedStatement ? { color: '#2e7d32' } : {}}
                                                >
                                                    <LinkIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        {(!inv.status || inv.status === 'draft') && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(inv)}
                                                title="Delete"
                                                sx={{ color: '#d32f2f' }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>

            <AttachmentsDialog
                isOpen={!!attachmentsInvoice}
                onClose={() => setAttachmentsInvoice(null)}
                invoice={attachmentsInvoice
                    ? invoices.find((i) => i.key === attachmentsInvoice.key) || attachmentsInvoice
                    : null}
            />

            <InvoiceEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={() => {}}
                initialData={editingInvoice}
                mode={editorMode}
                receivers={receivers}
                templates={templates}
                provider={provider}
            />

            <StatementLinkDialog
                isOpen={!!linkInvoice}
                onClose={() => setLinkInvoice(null)}
                invoice={linkInvoice
                    ? invoices.find((i) => i.key === linkInvoice.key) || linkInvoice
                    : null}
                statements={statements}
            />
        </Grid>
    )
}
