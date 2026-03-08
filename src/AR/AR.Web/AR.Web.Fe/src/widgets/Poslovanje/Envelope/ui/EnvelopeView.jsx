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
    ArrowBack,
    CalendarMonth,
    Delete,
    InsertDriveFile,
    Send,
} from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'

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
    const [receivers, setReceivers] = useState([])
    const [emailSettings, setEmailSettings] = useState(null)
    const [envelope, setEnvelope] = useState([])
    const [subject, setSubject] = useState('LimitlessSoft - Dokumentacija')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [filterDateFrom, setFilterDateFrom] = useState(
        `${new Date().getFullYear()}-01-01`,
    )
    const [filterDateTo, setFilterDateTo] = useState(
        `${new Date().getFullYear()}-12-31`,
    )
    const [dateMenuAnchor, setDateMenuAnchor] = useState(null)

    useEffect(() => {
        const unsub1 = poslovanjService.onInvoices(setInvoices)
        const unsub2 = poslovanjService.onReceivers(setReceivers)
        const unsub3 = poslovanjService.onEmailSettings(setEmailSettings)
        return () => {
            unsub1()
            unsub2()
            unsub3()
        }
    }, [])

    const receiverMap = Object.fromEntries(
        receivers.map((r) => [r.key, r]),
    )

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
    }, [invoices, receivers, filterType, filterDateFrom, filterDateTo])

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
                envelope.map((e) =>
                    poslovanjService.markAttachmentSent(
                        e.invoiceKey,
                        e.attachmentKey,
                        emailSettings.bookkeeperEmail,
                    ),
                ),
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
                        {invoicesWithAttachments.length === 0 && (
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
                        {invoicesWithAttachments.map((inv) => {
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
                                                <InsertDriveFile
                                                    fontSize="small"
                                                    color="action"
                                                />
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
