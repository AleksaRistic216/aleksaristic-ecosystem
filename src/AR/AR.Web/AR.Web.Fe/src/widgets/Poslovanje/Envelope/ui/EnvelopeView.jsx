import { useAuth } from '@/app/context/AuthContext'
import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Menu,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material'
import {
    AccountBalance,
    ArrowBack,
    CalendarMonth,
    Delete,
    InsertDriveFile,
    Send,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { statementToCsv, statementToPdf } from '../../utils/statementExport'

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i)

const lastDayOfMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate()

const parseInvoiceDate = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
}

const normalizeAttachments = (attachments) => {
    if (!attachments) return []
    if (Array.isArray(attachments)) {
        return attachments.map((a, i) => ({ key: String(i), ...a }))
    }
    return Object.entries(attachments).map(([key, val]) => ({ key, ...val }))
}

export const EnvelopeView = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const [invoices, setInvoices] = useState([])
    const [partners, setPartners] = useState([])
    const [statements, setStatements] = useState([])
    const [emailSettings, setEmailSettings] = useState(null)
    const [envelope, setEnvelope] = useState([])
    const [subject, setSubject] = useState('LimitlessSoft - Dokumentacija')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const [statementFormat, setStatementFormat] = useState('pdf')
    const [filterType, setFilterType] = useState('all')
    const [filterDateFrom, setFilterDateFrom] = useState(() => {
        const now = new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        return `${y}-${m}-01`
    })
    const [filterDateTo, setFilterDateTo] = useState(() => {
        const now = new Date()
        const y = now.getFullYear()
        const m = now.getMonth()
        return `${y}-${String(m + 1).padStart(2, '0')}-${lastDayOfMonth(y, m)}`
    })
    const [dateMenuAnchor, setDateMenuAnchor] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onInvoices(setInvoices)
        const unsub2 = poslovanjService.onPartners(setPartners)
        const unsub3 = poslovanjService.onEmailSettings(setEmailSettings)
        const unsub4 = poslovanjService.onStatements(setStatements)
        return () => {
            unsub1()
            unsub2()
            unsub3()
            unsub4()
        }
    }, [])

    const receiverMap = useMemo(() => {
        const map = {}
        partners.forEach((p) => {
            if (p.templateId || p.invoicePrefix || p.defaultCurrency) {
                map[p.key] = {
                    key: p.key,
                    name: p.name,
                    invoicePrefix: p.invoicePrefix || '',
                }
            }
        })
        return map
    }, [partners])

    const invoicesWithAttachments = useMemo(() => {
        const from = filterDateFrom ? new Date(filterDateFrom) : null
        const to = filterDateTo ? new Date(filterDateTo + 'T23:59:59') : null

        return invoices
            .filter(
                (inv) =>
                    (inv.status === 'sent' || inv.status === 'paid') &&
                    inv.attachments,
            )
            .filter((inv) => {
                if (filterType !== 'all' && filterType !== 'invoice')
                    return false
                if (from || to) {
                    const d = parseInvoiceDate(inv.date)
                    if (!d) return false
                    if (from && d < from) return false
                    if (to && d > to) return false
                }
                return true
            })
            .map((inv) => ({
                ...inv,
                parsedAttachments: normalizeAttachments(inv.attachments),
                receiverName:
                    inv.receiverSnapshot?.name ||
                    receiverMap[inv.receiverId]?.name ||
                    'Unknown',
                prefix:
                    inv.receiverSnapshot?.invoicePrefix ||
                    receiverMap[inv.receiverId]?.invoicePrefix ||
                    '',
            }))
            .filter((inv) => inv.parsedAttachments.length > 0)
    }, [invoices, receiverMap, filterType, filterDateFrom, filterDateTo])

    const filteredStatements = useMemo(() => {
        if (filterType !== 'all' && filterType !== 'statement') return []
        const from = filterDateFrom ? new Date(filterDateFrom) : null
        const to = filterDateTo ? new Date(filterDateTo + 'T23:59:59') : null

        return statements
            .filter((s) => {
                if (!from && !to) return true
                const parts = s.datumIzvoda?.split('.')
                if (!parts || parts.length < 3) return false
                const d = new Date(
                    `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`,
                )
                if (isNaN(d.getTime())) return false
                if (from && d < from) return false
                if (to && d > to) return false
                return true
            })
            .sort((a, b) => {
                const da = a.datumIzvoda.split('.').reverse().join('')
                const db = b.datumIzvoda.split('.').reverse().join('')
                return db.localeCompare(da)
            })
    }, [statements, filterType, filterDateFrom, filterDateTo])

    const toggleStatement = (statement) => {
        const id = `stmt::${statement.key}`
        setEnvelope((prev) => {
            const exists = prev.find((e) => e.id === id)
            if (exists) return prev.filter((e) => e.id !== id)

            const label = `Statement #${statement.brojIzvoda} (${statement.datumIzvoda})`
            const ext = statementFormat === 'pdf' ? 'pdf' : 'csv'
            const fileName = `izvod_${statement.partija}_${statement.brojIzvoda}_${statement.datumIzvoda.replace(/\./g, '-')}.${ext}`
            const data =
                statementFormat === 'pdf'
                    ? statementToPdf(statement)
                    : statementToCsv(statement)

            return [
                ...prev,
                {
                    id,
                    statementKey: statement.key,
                    invoiceLabel: label,
                    name: fileName,
                    data,
                    type: statementFormat === 'pdf' ? 'application/pdf' : 'text/csv',
                },
            ]
        })
    }

    const isStatementInEnvelope = (key) => {
        return envelope.some((e) => e.id === `stmt::${key}`)
    }

    const toggleAttachment = (invoiceKey, attachment, invoiceLabel) => {
        const id = `${invoiceKey}::${attachment.key}`
        setEnvelope((prev) => {
            const exists = prev.find((e) => e.id === id)
            if (exists) return prev.filter((e) => e.id !== id)
            return [
                ...prev,
                {
                    id,
                    invoiceKey,
                    attachmentKey: attachment.key,
                    invoiceLabel,
                    name: attachment.name,
                    data: attachment.data,
                    type: attachment.type,
                },
            ]
        })
    }

    const removeFromEnvelope = (id) => {
        setEnvelope((prev) => prev.filter((e) => e.id !== id))
    }

    const isInEnvelope = (invoiceKey, attachmentKey) => {
        return envelope.some((e) => e.id === `${invoiceKey}::${attachmentKey}`)
    }

    const allSelected = useMemo(() => {
        const ids = []
        if (filterType !== 'statement') {
            invoicesWithAttachments.forEach((inv) => {
                const fullNumber = (inv.receiverSnapshot?.invoicePrefix || receiverMap[inv.receiverId]?.invoicePrefix || '') + inv.invoiceNumber
                inv.parsedAttachments.forEach((att) => {
                    ids.push({
                        id: `${inv.key}::${att.key}`,
                        invoiceKey: inv.key,
                        attachmentKey: att.key,
                        invoiceLabel: fullNumber,
                        name: att.name,
                        data: att.data,
                        type: att.type,
                    })
                })
            })
        }
        if (filterType !== 'invoice') {
            filteredStatements.forEach((s) => {
                const label = `Statement #${s.brojIzvoda} (${s.datumIzvoda})`
                const ext = statementFormat === 'pdf' ? 'pdf' : 'csv'
                const fileName = `izvod_${s.partija}_${s.brojIzvoda}_${s.datumIzvoda.replace(/\./g, '-')}.${ext}`
                ids.push({
                    id: `stmt::${s.key}`,
                    statementKey: s.key,
                    invoiceLabel: label,
                    name: fileName,
                    statement: s,
                })
            })
        }
        return ids
    }, [invoicesWithAttachments, filteredStatements, filterType, statementFormat, receiverMap])

    const isAllChecked = allSelected.length > 0 && allSelected.every((item) => envelope.some((e) => e.id === item.id))

    const handleToggleAll = () => {
        if (isAllChecked) {
            const ids = new Set(allSelected.map((i) => i.id))
            setEnvelope((prev) => prev.filter((e) => !ids.has(e.id)))
        } else {
            setEnvelope((prev) => {
                const existing = new Set(prev.map((e) => e.id))
                const toAdd = allSelected
                    .filter((item) => !existing.has(item.id))
                    .map((item) => {
                        if (item.statement) {
                            const data = statementFormat === 'pdf'
                                ? statementToPdf(item.statement)
                                : statementToCsv(item.statement)
                            return {
                                id: item.id,
                                statementKey: item.statementKey,
                                invoiceLabel: item.invoiceLabel,
                                name: item.name,
                                data,
                                type: statementFormat === 'pdf' ? 'application/pdf' : 'text/csv',
                            }
                        }
                        return item
                    })
                return [...prev, ...toAdd]
            })
        }
    }

    const handleSend = async () => {
        if (!emailSettings?.senderEmail || !emailSettings?.appPassword || !emailSettings?.bookkeeperEmail) {
            toast('Email not configured. Go to Settings > Email.', {
                type: 'warning',
            })
            return
        }
        if (envelope.length === 0) {
            toast('Add attachments to the envelope first', {
                type: 'warning',
            })
            return
        }

        setSending(true)
        try {
            const res = await fetch('/api/poslovanje/send-envelope', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderEmail: emailSettings.senderEmail,
                    appPassword: emailSettings.appPassword,
                    bookkeeperEmail: emailSettings.bookkeeperEmail,
                    subject,
                    body,
                    attachments: envelope.map((e) => ({
                        name: e.name,
                        data: e.data,
                    })),
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await Promise.all(
                envelope.map((e) => {
                    if (e.statementKey) {
                        return poslovanjService.markStatementSent(
                            e.statementKey,
                            emailSettings.bookkeeperEmail,
                        )
                    }
                    if (e.invoiceKey && e.attachmentKey) {
                        return poslovanjService.markAttachmentSent(
                            e.invoiceKey,
                            e.attachmentKey,
                            emailSettings.bookkeeperEmail,
                        )
                    }
                    return Promise.resolve()
                }),
            )

            toast('Envelope sent successfully', { type: 'success' })
            setEnvelope([])
        } catch (error) {
            toast(error.message || 'Failed to send', { type: 'error' })
        } finally {
            setSending(false)
        }
    }

    if (!isAdmin) return null

    return (
        <Grid container justifyContent="center" py={4} px={2}>
            <Grid item xs={12} md={10} lg={8}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 3,
                    }}
                >
                    <IconButton
                        onClick={() => router.push('/poslovanje')}
                        size="small"
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" fontWeight={600}>
                        Envelope
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                mb: 2,
                                flexWrap: 'wrap',
                            }}
                        >
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>Type</InputLabel>
                                <Select
                                    value={filterType}
                                    label="Type"
                                    onChange={(e) =>
                                        setFilterType(e.target.value)
                                    }
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="invoice">Invoice</MenuItem>
                                    <MenuItem value="statement">Bank Statement</MenuItem>
                                </Select>
                            </FormControl>
                            <Chip
                                label={`${filterDateFrom} — ${filterDateTo}`}
                                variant="outlined"
                                size="small"
                                sx={{ alignSelf: 'center' }}
                            />
                            <IconButton
                                size="small"
                                onClick={(e) => setDateMenuAnchor(e.currentTarget)}
                            >
                                <CalendarMonth fontSize="small" />
                            </IconButton>
                            {allSelected.length > 0 && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={isAllChecked}
                                            indeterminate={
                                                !isAllChecked &&
                                                allSelected.some((item) =>
                                                    envelope.some((e) => e.id === item.id),
                                                )
                                            }
                                            onChange={handleToggleAll}
                                        />
                                    }
                                    label="Select all"
                                    sx={{ ml: 0.5, '& .MuiTypography-root': { fontSize: '0.85rem' } }}
                                />
                            )}
                            <Menu
                                anchorEl={dateMenuAnchor}
                                open={!!dateMenuAnchor}
                                onClose={() => setDateMenuAnchor(null)}
                                slotProps={{
                                    paper: { sx: { maxHeight: 400 } },
                                }}
                            >
                                <MenuItem
                                    onClick={() => {
                                        const y = new Date().getFullYear()
                                        setFilterDateFrom(`${y}-01-01`)
                                        setFilterDateTo(`${y}-12-31`)
                                        setDateMenuAnchor(null)
                                    }}
                                >
                                    Current Year
                                </MenuItem>
                                <MenuItem
                                    onClick={() => {
                                        const now = new Date()
                                        const y = now.getFullYear()
                                        const m = String(now.getMonth() + 1).padStart(2, '0')
                                        const last = lastDayOfMonth(y, now.getMonth())
                                        setFilterDateFrom(`${y}-${m}-01`)
                                        setFilterDateTo(`${y}-${m}-${last}`)
                                        setDateMenuAnchor(null)
                                    }}
                                >
                                    Current Month
                                </MenuItem>
                                <Divider />
                                <ListSubheader>Month</ListSubheader>
                                {MONTHS.map((name, i) => {
                                    const m = String(i + 1).padStart(2, '0')
                                    const y = filterDateFrom
                                        ? filterDateFrom.slice(0, 4)
                                        : String(currentYear)
                                    const last = lastDayOfMonth(
                                        parseInt(y),
                                        i,
                                    )
                                    return (
                                        <MenuItem
                                            key={name}
                                            onClick={() => {
                                                setFilterDateFrom(
                                                    `${y}-${m}-01`,
                                                )
                                                setFilterDateTo(
                                                    `${y}-${m}-${last}`,
                                                )
                                                setDateMenuAnchor(null)
                                            }}
                                        >
                                            {name}
                                        </MenuItem>
                                    )
                                })}
                                <Divider />
                                <ListSubheader>Year</ListSubheader>
                                {YEARS.map((y) => (
                                    <MenuItem
                                        key={y}
                                        onClick={() => {
                                            setFilterDateFrom(`${y}-01-01`)
                                            setFilterDateTo(`${y}-12-31`)
                                            setDateMenuAnchor(null)
                                        }}
                                    >
                                        {y}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                        {filterType !== 'statement' &&
                            invoicesWithAttachments.length === 0 && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No invoices with attachments found
                            </Paper>
                        )}
                        {filterType !== 'statement' && invoicesWithAttachments.map((inv) => {
                            const fullNumber =
                                inv.prefix + inv.invoiceNumber
                            return (
                                <Paper
                                    key={inv.key}
                                    variant="outlined"
                                    sx={{ mb: 1.5, p: 2 }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        fontWeight={600}
                                    >
                                        {fullNumber}
                                        <Chip
                                            label={inv.receiverName}
                                            size="small"
                                            sx={{ ml: 1 }}
                                        />
                                        <Chip
                                            label={inv.status}
                                            size="small"
                                            sx={{
                                                ml: 0.5,
                                                ...(inv.status === 'paid'
                                                    ? {
                                                          bgcolor: '#2e7d32',
                                                          color: '#fff',
                                                      }
                                                    : {
                                                          bgcolor: '#000',
                                                          color: '#fff',
                                                      }),
                                            }}
                                        />
                                    </Typography>
                                    <List dense disablePadding>
                                        {inv.parsedAttachments.map((att) => (
                                            <ListItem
                                                key={att.key}
                                                disableGutters
                                                sx={{ py: 0.25 }}
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={isInEnvelope(
                                                        inv.key,
                                                        att.key,
                                                    )}
                                                    onChange={() =>
                                                        toggleAttachment(
                                                            inv.key,
                                                            att,
                                                            fullNumber,
                                                        )
                                                    }
                                                    sx={{ mr: 1 }}
                                                />
                                                <ListItemIcon
                                                    sx={{ minWidth: 28 }}
                                                >
                                                    <InsertDriveFile
                                                        fontSize="small"
                                                        color="action"
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={att.name}
                                                    secondary={
                                                        att.sendHistory
                                                            ? Object.values(att.sendHistory)
                                                                .sort((a, b) => b.sentAt - a.sentAt)
                                                                .map((h) => `${new Date(h.sentAt).toLocaleDateString()} \u2192 ${h.sentTo}`)
                                                                .join('\n')
                                                            : null
                                                    }
                                                    primaryTypographyProps={{
                                                        fontSize: '0.85rem',
                                                    }}
                                                    secondaryTypographyProps={{
                                                        fontSize: '0.75rem',
                                                        sx: { color: '#2e7d32', whiteSpace: 'pre-line' },
                                                    }}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Paper>
                            )
                        })}
                        {filterType !== 'invoice' && filteredStatements.length > 0 && (
                            <>
                                <Typography
                                    variant="subtitle2"
                                    fontWeight={600}
                                    sx={{
                                        mt: filterType === 'all' ? 2 : 0,
                                        mb: 1,
                                    }}
                                >
                                    Bank Statements
                                </Typography>
                                {filteredStatements.map((s) => (
                                    <Paper
                                        key={s.key}
                                        variant="outlined"
                                        sx={{ mb: 1.5, p: 2 }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Checkbox
                                                size="small"
                                                checked={isStatementInEnvelope(s.key)}
                                                onChange={() => toggleStatement(s)}
                                                sx={{ mr: 1 }}
                                            />
                                            <AccountBalance
                                                fontSize="small"
                                                sx={{ mr: 1, color: 'text.secondary' }}
                                            />
                                            <Box>
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={600}
                                                >
                                                    #{s.brojIzvoda} — {s.datumIzvoda}
                                                    <Chip
                                                        label={s.valuta || 'RSD'}
                                                        size="small"
                                                        sx={{ ml: 1 }}
                                                    />
                                                    <Chip
                                                        label={s.partija}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ ml: 0.5 }}
                                                    />
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Balance: {(s.novoStanje || 0).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {s.valuta || 'RSD'}
                                                </Typography>
                                                {s.sendHistory && (
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: '#2e7d32', whiteSpace: 'pre-line', display: 'block' }}
                                                    >
                                                        {Object.values(s.sendHistory)
                                                            .sort((a, b) => b.sentAt - a.sentAt)
                                                            .map((h) => `${new Date(h.sentAt).toLocaleDateString()} \u2192 ${h.sentTo}`)
                                                            .join('\n')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </>
                        )}
                        {filterType !== 'invoice' && filteredStatements.length === 0 && filterType === 'statement' && (
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    color: 'text.secondary',
                                }}
                            >
                                No bank statements found
                            </Paper>
                        )}
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                sx={{ mb: 1.5 }}
                            >
                                Envelope ({envelope.length}{' '}
                                {envelope.length === 1 ? 'file' : 'files'})
                            </Typography>

                            {emailSettings?.bookkeeperEmail && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1.5 }}
                                >
                                    To: {emailSettings.bookkeeperEmail}
                                </Typography>
                            )}

                            <TextField
                                label="Subject"
                                fullWidth
                                size="small"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                sx={{ mb: 1.5 }}
                            />
                            <TextField
                                label="Message (optional)"
                                fullWidth
                                size="small"
                                multiline
                                rows={2}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                sx={{ mb: 1.5 }}
                            />

                            <Divider sx={{ mb: 1.5 }} />

                            {envelope.some((e) => e.id.startsWith('stmt::')) && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 1.5,
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary">
                                        Statement format:
                                    </Typography>
                                    <FormControl size="small" sx={{ minWidth: 80 }}>
                                        <Select
                                            value={statementFormat}
                                            onChange={(e) => {
                                                const fmt = e.target.value
                                                setStatementFormat(fmt)
                                                setEnvelope((prev) =>
                                                    prev.map((item) => {
                                                        if (!item.id.startsWith('stmt::')) return item
                                                        const s = statements.find((st) => st.key === item.statementKey)
                                                        if (!s) return item
                                                        const ext = fmt === 'pdf' ? 'pdf' : 'csv'
                                                        const fileName = `izvod_${s.partija}_${s.brojIzvoda}_${s.datumIzvoda.replace(/\./g, '-')}.${ext}`
                                                        const data = fmt === 'pdf' ? statementToPdf(s) : statementToCsv(s)
                                                        return {
                                                            ...item,
                                                            name: fileName,
                                                            data,
                                                            type: fmt === 'pdf' ? 'application/pdf' : 'text/csv',
                                                        }
                                                    }),
                                                )
                                            }}
                                            sx={{ fontSize: '0.8rem', height: 28 }}
                                        >
                                            <MenuItem value="pdf">PDF</MenuItem>
                                            <MenuItem value="csv">CSV</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}

                            {envelope.length === 0 ? (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ py: 2, textAlign: 'center' }}
                                >
                                    No files selected
                                </Typography>
                            ) : (
                                <List dense disablePadding>
                                    {envelope.map((item) => (
                                        <ListItem
                                            key={item.id}
                                            disableGutters
                                            secondaryAction={
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        removeFromEnvelope(
                                                            item.id,
                                                        )
                                                    }
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            }
                                            sx={{ py: 0.25 }}
                                        >
                                            <ListItemIcon
                                                sx={{ minWidth: 28 }}
                                            >
                                                {item.id.startsWith('stmt::') ? (
                                                    <AccountBalance
                                                        fontSize="small"
                                                        color="action"
                                                    />
                                                ) : (
                                                    <InsertDriveFile
                                                        fontSize="small"
                                                        color="action"
                                                    />
                                                )}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={item.invoiceLabel}
                                                primaryTypographyProps={{
                                                    fontSize: '0.85rem',
                                                    noWrap: true,
                                                }}
                                                secondaryTypographyProps={{
                                                    fontSize: '0.75rem',
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}

                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={
                                    sending ? (
                                        <CircularProgress
                                            size={18}
                                            color="inherit"
                                        />
                                    ) : (
                                        <Send />
                                    )
                                }
                                onClick={handleSend}
                                disabled={
                                    sending || envelope.length === 0
                                }
                                sx={{ textTransform: 'none', mt: 2 }}
                            >
                                {sending ? 'Sending...' : 'Send Envelope'}
                            </Button>
                        </Paper>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}
