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
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

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

const parseSerbianDate = (dateStr) => {
    if (!dateStr) return ''
    const parts = dateStr.split('.')
    if (parts.length < 3) return ''
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

export const ForexDialog = ({
    isOpen,
    onClose,
    statements,
    linkedRefs,
}) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [selected, setSelected] = useState(new Set())
    const [note, setNote] = useState('')
    const [filterAccount, setFilterAccount] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setSelected(new Set())
            setNote('')
            setFilterAccount('')
        }
    }, [isOpen])

    const accounts = useMemo(() => {
        const map = {}
        statements.forEach((s) => {
            if (!map[s.partija]) {
                map[s.partija] = { partija: s.partija, valuta: s.valuta || 'RSD' }
            }
        })
        return Object.values(map).sort((a, b) =>
            a.partija.localeCompare(b.partija),
        )
    }, [statements])

    const allTransactions = useMemo(() => {
        const items = []
        statements.forEach((s) => {
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((t, i) => {
                const id = `${s.key}::${i}`
                if (linkedRefs.has(id)) return
                const amount = t.duguje > 0 ? t.duguje : t.potrazuje
                if (!amount) return
                items.push({
                    id,
                    amount,
                    isDebit: t.duguje > 0,
                    currency: s.valuta || 'RSD',
                    partija: s.partija,
                    datumValute: t.datumValute,
                    date: parseSerbianDate(t.datumValute),
                    nalogKorisnik: t.nalogKorisnik || '',
                    opis: t.opis || '',
                })
            })
        })
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        return items
    }, [statements, linkedRefs])

    const filtered = useMemo(() => {
        if (!filterAccount) return allTransactions
        return allTransactions.filter((t) => t.partija === filterAccount)
    }, [allTransactions, filterAccount])

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectedItems = useMemo(() => {
        return allTransactions.filter((t) => selected.has(t.id))
    }, [allTransactions, selected])

    const summary = useMemo(() => {
        const debits = {}
        const credits = {}
        selectedItems.forEach((t) => {
            const target = t.isDebit ? debits : credits
            target[t.currency] = (target[t.currency] || 0) + t.amount
        })
        return { debits, credits }
    }, [selectedItems])

    const handleSave = async () => {
        if (selectedItems.length < 2) {
            toast('Select at least 2 transactions', { type: 'warning' })
            return
        }
        setSaving(true)
        try {
            const date = selectedItems[0].date
            const transactions = selectedItems.map((t) => ({
                ref: t.id,
                amount: t.amount,
                currency: t.currency,
                isDebit: t.isDebit,
                label: `${t.datumValute} | ${fmtNum(t.amount)} ${t.currency} | ${t.nalogKorisnik}`,
            }))
            await poslovanjService.createForexExchange({
                date,
                transactions,
                note,
            })
            toast('Forex exchange created', { type: 'success' })
            onClose()
        } catch {
            toast('Failed to create', { type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
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
                New Forex Exchange
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        mt: 1,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}
                >
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Filter by Account</InputLabel>
                        <Select
                            value={filterAccount}
                            label="Filter by Account"
                            onChange={(e) => setFilterAccount(e.target.value)}
                        >
                            <MenuItem value="">All accounts</MenuItem>
                            {accounts.map((acc) => (
                                <MenuItem
                                    key={acc.partija}
                                    value={acc.partija}
                                >
                                    {acc.partija} ({acc.valuta})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Note"
                        size="small"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        sx={{ flex: 1, minWidth: 150 }}
                    />
                </Box>

                {selectedItems.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 2,
                            mb: 2,
                            p: 1.5,
                            bgcolor: 'grey.50',
                            borderRadius: 1,
                            flexWrap: 'wrap',
                            alignItems: 'center',
                        }}
                    >
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mr: 1 }}
                        >
                            Selected ({selectedItems.length}):
                        </Typography>
                        {Object.entries(summary.debits).map(([cur, amt]) => (
                            <Chip
                                key={`d-${cur}`}
                                label={`-${fmtNum(amt)} ${cur}`}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(211, 47, 47, 0.1)',
                                    color: '#d32f2f',
                                    fontWeight: 600,
                                }}
                            />
                        ))}
                        {Object.entries(summary.credits).map(([cur, amt]) => (
                            <Chip
                                key={`c-${cur}`}
                                label={`+${fmtNum(amt)} ${cur}`}
                                size="small"
                                sx={{
                                    bgcolor: 'rgba(46, 125, 50, 0.1)',
                                    color: '#2e7d32',
                                    fontWeight: 600,
                                }}
                            />
                        ))}
                    </Box>
                )}

                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    padding="checkbox"
                                    sx={{ bgcolor: 'grey.50' }}
                                />
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Date</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Account</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Payer/Payee</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Description</strong>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ bgcolor: 'grey.50' }}
                                >
                                    <strong>Amount</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        align="center"
                                        sx={{
                                            py: 4,
                                            color: 'text.secondary',
                                        }}
                                    >
                                        No unlinked transactions
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((t) => (
                                <TableRow
                                    key={t.id}
                                    hover
                                    onClick={() => toggleSelect(t.id)}
                                    sx={{
                                        cursor: 'pointer',
                                        bgcolor: selected.has(t.id)
                                            ? 'rgba(25, 118, 210, 0.08)'
                                            : undefined,
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            size="small"
                                            checked={selected.has(t.id)}
                                        />
                                    </TableCell>
                                    <TableCell>{t.datumValute}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${t.partija} (${t.currency})`}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap>
                                            {t.nalogKorisnik}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            noWrap
                                            color="text.secondary"
                                        >
                                            {t.opis}
                                        </Typography>
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        sx={{
                                            fontWeight: 600,
                                            color: t.isDebit
                                                ? '#d32f2f'
                                                : '#2e7d32',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {t.isDebit ? '-' : '+'}
                                        {fmtNum(t.amount)} {t.currency}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving || selectedItems.length < 2}
                    sx={{ textTransform: 'none' }}
                >
                    {saving ? 'Saving...' : 'Create Exchange'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
