import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Chip,
    Dialog,
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
} from '@mui/material'
import { Close, Link as LinkIcon, LinkOff } from '@mui/icons-material'
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
    return Object.entries(stavke).map(([key, val]) => ({ ...val, _key: key }))
}

export const StatementLinkDialog = ({ isOpen, onClose, invoice, statements }) => {
    const [filterAccount, setFilterAccount] = useState('')
    const [filterSearch, setFilterSearch] = useState('')

    useEffect(() => {
        if (isOpen) {
            setFilterSearch('')
        }
    }, [isOpen])

    const accounts = useMemo(() => {
        const set = new Set(statements.map((s) => s.partija))
        return Array.from(set).sort()
    }, [statements])

    const creditItems = useMemo(() => {
        const items = []
        for (const s of statements) {
            if (filterAccount && s.partija !== filterAccount) continue
            const stavke = normalizeStavke(s.stavke)
            stavke.forEach((stavka, index) => {
                if (stavka.potrazuje > 0) {
                    items.push({
                        statementKey: s.key,
                        stavkaIndex: index,
                        brojIzvoda: s.brojIzvoda,
                        datumIzvoda: s.datumIzvoda,
                        partija: s.partija,
                        valuta: s.valuta,
                        nalogKorisnik: stavka.nalogKorisnik,
                        opis: stavka.opis,
                        potrazuje: stavka.potrazuje,
                        datumValute: stavka.datumValute,
                        brojRacuna: stavka.brojRacuna,
                    })
                }
            })
        }
        items.sort((a, b) => {
            const da = a.datumIzvoda.split('.').reverse().join('')
            const db = b.datumIzvoda.split('.').reverse().join('')
            return db.localeCompare(da)
        })
        return items
    }, [statements, filterAccount])

    const filtered = useMemo(() => {
        if (!filterSearch) return creditItems
        const q = filterSearch.toLowerCase()
        return creditItems.filter(
            (item) =>
                (item.nalogKorisnik || '').toLowerCase().includes(q) ||
                (item.opis || '').toLowerCase().includes(q) ||
                (item.brojRacuna || '').toLowerCase().includes(q) ||
                String(item.potrazuje).includes(q) ||
                (item.datumIzvoda || '').includes(q),
        )
    }, [creditItems, filterSearch])

    if (!invoice) return null

    const isLinked = (item) =>
        invoice.linkedStatement?.statementKey === item.statementKey &&
        invoice.linkedStatement?.stavkaIndex === item.stavkaIndex

    const handleLink = async (item) => {
        try {
            await poslovanjService.linkInvoiceToStatement(invoice.key, {
                statementKey: item.statementKey,
                stavkaIndex: item.stavkaIndex,
                brojIzvoda: item.brojIzvoda,
                datumIzvoda: item.datumIzvoda,
                partija: item.partija,
                valuta: item.valuta,
                nalogKorisnik: item.nalogKorisnik,
                potrazuje: item.potrazuje,
                datumValute: item.datumValute,
            })
            toast('Invoice linked to statement', { type: 'success' })
            onClose()
        } catch (error) {
            toast('Failed to link', { type: 'error' })
        }
    }

    const handleUnlink = async () => {
        try {
            await poslovanjService.unlinkInvoiceFromStatement(invoice.key)
            toast('Invoice unlinked', { type: 'success' })
            onClose()
        } catch (error) {
            toast('Failed to unlink', { type: 'error' })
        }
    }

    const receiver =
        invoice.receiverSnapshot?.name || 'Invoice'
    const fullNumber =
        (invoice.receiverSnapshot?.invoicePrefix || '') + invoice.invoiceNumber

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Link to Bank Statement
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {fullNumber} &mdash; {fmtNum(invoice.totalAmount)}{' '}
                        {invoice.currency} &mdash; {receiver}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                {invoice.linkedStatement && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1.5,
                            mb: 2,
                            mt: 1,
                            bgcolor: '#e8f5e9',
                            borderRadius: 2,
                            border: '1px solid #a5d6a7',
                        }}
                    >
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                Currently linked to Statement #
                                {invoice.linkedStatement.brojIzvoda} (
                                {invoice.linkedStatement.datumIzvoda})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {invoice.linkedStatement.nalogKorisnik} &mdash;{' '}
                                {fmtNum(invoice.linkedStatement.potrazuje)}{' '}
                                {invoice.linkedStatement.valuta}
                            </Typography>
                        </Box>
                        <IconButton
                            size="small"
                            onClick={handleUnlink}
                            title="Unlink"
                            sx={{ color: '#d32f2f' }}
                        >
                            <LinkOff />
                        </IconButton>
                    </Box>
                )}

                <Box
                    sx={{
                        display: 'flex',
                        gap: 2,
                        mb: 2,
                        mt: 1,
                        flexWrap: 'wrap',
                    }}
                >
                    <TextField
                        size="small"
                        placeholder="Search payer, description, amount..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        sx={{ minWidth: 280, flex: 1 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 250 }}>
                        <InputLabel>Account</InputLabel>
                        <Select
                            value={filterAccount}
                            label="Account"
                            onChange={(e) => setFilterAccount(e.target.value)}
                        >
                            <MenuItem value="">All Accounts</MenuItem>
                            {accounts.map((acc) => (
                                <MenuItem key={acc} value={acc}>
                                    {acc}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                <TableContainer sx={{ maxHeight: 420 }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Statement</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Payer</strong>
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
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Value Date</strong>
                                </TableCell>
                                <TableCell
                                    align="center"
                                    sx={{ bgcolor: 'grey.50' }}
                                >
                                    <strong>Action</strong>
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
                                        No credit transactions found
                                    </TableCell>
                                </TableRow>
                            )}
                            {filtered.map((item, i) => {
                                const linked = isLinked(item)
                                return (
                                    <TableRow
                                        key={`${item.statementKey}-${item.stavkaIndex}`}
                                        hover
                                        sx={
                                            linked
                                                ? {
                                                      bgcolor: '#e8f5e9',
                                                  }
                                                : undefined
                                        }
                                    >
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                            >
                                                #{item.brojIzvoda}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {item.datumIzvoda}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item.nalogKorisnik}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {item.brojRacuna}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {item.opis}
                                            </Typography>
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{ color: '#2e7d32' }}
                                        >
                                            {fmtNum(item.potrazuje)}{' '}
                                            {item.valuta}
                                        </TableCell>
                                        <TableCell>
                                            {item.datumValute}
                                        </TableCell>
                                        <TableCell align="center">
                                            {linked ? (
                                                <IconButton
                                                    size="small"
                                                    onClick={handleUnlink}
                                                    title="Unlink"
                                                    sx={{ color: '#d32f2f' }}
                                                >
                                                    <LinkOff fontSize="small" />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleLink(item)
                                                    }
                                                    title="Link to this transaction"
                                                    sx={{ color: '#1976d2' }}
                                                >
                                                    <LinkIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    )
}
