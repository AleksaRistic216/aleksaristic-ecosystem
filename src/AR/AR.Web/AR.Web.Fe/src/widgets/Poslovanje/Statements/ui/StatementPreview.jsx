import {
    Autocomplete,
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import { AccountBalance, Close, LinkOff, MoreVert, PersonAdd, Receipt } from '@mui/icons-material'
import { useState } from 'react'
import { poslovanjService } from '@/app/services/poslovanjService'
import { toast } from 'react-toastify'

const fmtNum = (n) =>
    (n || 0).toLocaleString('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const InfoRow = ({ label, value }) => (
    <Grid item xs={6} sm={4}>
        <Typography variant="caption" color="text.secondary">
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={500}>
            {value}
        </Typography>
    </Grid>
)

const normalizeStavke = (stavke) => {
    if (!stavke) return []
    if (Array.isArray(stavke)) return stavke
    return Object.values(stavke)
}

export const StatementPreview = ({
    isOpen,
    onClose,
    statement,
    linkedByExpenses,
    linkedByInvoices,
    linkedByPartners,
    partners = [],
    onCreateExpense,
    onCreateGovernmentExpense,
}) => {
    const [linking, setLinking] = useState(null)
    const [menuAnchor, setMenuAnchor] = useState(null)
    const [menuIndex, setMenuIndex] = useState(null)

    if (!statement) return null

    const stavke = normalizeStavke(statement.stavke)

    const isLinked = (s, i) => {
        const id = `${statement.key}::${i}`
        if (linkedByPartners?.has(id)) return true
        if (s.duguje > 0) return linkedByExpenses?.has(id)
        if (s.potrazuje > 0) return linkedByInvoices?.has(id) || linkedByExpenses?.has(id)
        return true
    }

    const getPartnerLink = (i) => {
        const id = `${statement.key}::${i}`
        return linkedByPartners?.get(id) || null
    }

    const getExpenseLink = (i) => {
        const id = `${statement.key}::${i}`
        return linkedByExpenses?.get(id) || null
    }

    const handleLinkPartner = async (i, partner) => {
        if (!partner) return
        const txRef = `${statement.key}::${i}`
        try {
            await poslovanjService.linkTransactionToPartner(
                txRef,
                partner.key,
                partner.name,
            )
            setLinking(null)
            toast('Linked to partner', { type: 'success' })
        } catch {
            toast('Failed to link', { type: 'error' })
        }
    }

    const handleUnlinkPartner = async (tp) => {
        try {
            await poslovanjService.unlinkTransactionFromPartner(tp.key)
            toast('Unlinked from partner', { type: 'success' })
        } catch {
            toast('Failed to unlink', { type: 'error' })
        }
    }

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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                        Statement #{statement.brojIzvoda}
                    </Typography>
                    <Chip
                        label={statement.datumIzvoda}
                        size="small"
                        variant="outlined"
                    />
                </Box>
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    <InfoRow
                        label="Company"
                        value={statement.komitentNaziv}
                    />
                    <InfoRow
                        label="Address"
                        value={`${statement.komitentAdresa}, ${statement.komitentMesto}`}
                    />
                    <InfoRow
                        label="Registration #"
                        value={statement.maticniBroj}
                    />
                    <InfoRow label="Account" value={statement.partija} />
                    <InfoRow
                        label="Account Type"
                        value={statement.tipRacuna}
                    />
                    <InfoRow
                        label="Date"
                        value={statement.datumIzvoda}
                    />
                </Grid>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 3,
                        mb: 3,
                        flexWrap: 'wrap',
                    }}
                >
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Previous Balance
                        </Typography>
                        <Typography variant="h6">
                            {fmtNum(statement.prethodnoStanje)} {statement.valuta}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Debit
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#d32f2f' }}>
                            -{fmtNum(statement.dugovniPromet)} {statement.valuta}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Credit
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#2e7d32' }}>
                            +{fmtNum(statement.potrazniPromet)} {statement.valuta}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            New Balance
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                            {fmtNum(statement.novoStanje)} {statement.valuta}
                        </Typography>
                    </Box>
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Transactions ({stavke.length})
                </Typography>
                <TableContainer>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Payer/Payee</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Description</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Payment Code</strong>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ bgcolor: 'grey.50' }}
                                >
                                    <strong>Debit</strong>
                                </TableCell>
                                <TableCell
                                    align="right"
                                    sx={{ bgcolor: 'grey.50' }}
                                >
                                    <strong>Credit</strong>
                                </TableCell>
                                <TableCell sx={{ bgcolor: 'grey.50' }}>
                                    <strong>Value Date</strong>
                                </TableCell>
                                <TableCell
                                    sx={{ bgcolor: 'grey.50', minWidth: 180 }}
                                >
                                    <strong>Partner</strong>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stavke.map((s, i) => {
                                const partnerLink = getPartnerLink(i)
                                const expenseLink = getExpenseLink(i)
                                return (
                                    <TableRow
                                        key={i}
                                        hover
                                        sx={{
                                            bgcolor: isLinked(s, i)
                                                ? 'rgba(46, 125, 50, 0.15)'
                                                : 'rgba(237, 108, 2, 0.12)',
                                        }}
                                    >
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                            >
                                                {s.nalogKorisnik}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {s.brojRacuna}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {s.opis}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${s.sifraPlacanja} - ${s.sifraPlacanjaOpis}`}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color:
                                                    s.duguje > 0
                                                        ? '#d32f2f'
                                                        : undefined,
                                            }}
                                        >
                                            {s.duguje > 0
                                                ? `${fmtNum(s.duguje)} ${statement.valuta}`
                                                : ''}
                                        </TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color:
                                                    s.potrazuje > 0
                                                        ? '#2e7d32'
                                                        : undefined,
                                            }}
                                        >
                                            {s.potrazuje > 0
                                                ? `${fmtNum(s.potrazuje)} ${statement.valuta}`
                                                : ''}
                                        </TableCell>
                                        <TableCell>{s.datumValute}</TableCell>
                                        <TableCell>
                                            {partnerLink ? (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    <Chip
                                                        label={
                                                            partnerLink.partnerName
                                                        }
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ color: '#000' }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleUnlinkPartner(
                                                                partnerLink,
                                                            )
                                                        }
                                                        title="Unlink partner"
                                                        sx={{
                                                            color: '#d32f2f',
                                                        }}
                                                    >
                                                        <LinkOff
                                                            sx={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Box>
                                            ) : expenseLink ? (
                                                <Chip
                                                    label={
                                                        expenseLink.type === 'forex'
                                                            ? 'Forex'
                                                            : expenseLink.partnerName || (expenseLink.type === 'government' ? 'Gov. expense' : 'Expense')
                                                    }
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                        color: '#000',
                                                        borderColor:
                                                            expenseLink.type === 'government'
                                                                ? '#ed6c02'
                                                                : expenseLink.type === 'forex'
                                                                    ? '#1976d2'
                                                                    : undefined,
                                                    }}
                                                />
                                            ) : (
                                                linking === i ? (
                                                    <Autocomplete
                                                        size="small"
                                                        options={partners}
                                                        getOptionLabel={(o) =>
                                                            o.name || ''
                                                        }
                                                        onChange={(_, v) =>
                                                            handleLinkPartner(
                                                                i,
                                                                v,
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            setLinking(null)
                                                        }
                                                        openOnFocus
                                                        autoHighlight
                                                        renderInput={(
                                                            params,
                                                        ) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Select partner..."
                                                                variant="standard"
                                                                autoFocus
                                                                sx={{
                                                                    minWidth: 150,
                                                                }}
                                                            />
                                                        )}
                                                    />
                                                ) : (
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            setMenuAnchor(e.currentTarget)
                                                            setMenuIndex(i)
                                                        }}
                                                    >
                                                        <MoreVert fontSize="small" />
                                                    </IconButton>
                                                )
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>

            <Menu
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={() => setMenuAnchor(null)}
            >
                <MenuItem
                    onClick={() => {
                        const idx = menuIndex
                        setMenuAnchor(null)
                        setMenuIndex(null)
                        setTimeout(() => setLinking(idx), 150)
                    }}
                >
                    <ListItemIcon>
                        <PersonAdd fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Map to partner</ListItemText>
                </MenuItem>
                {menuIndex !== null &&
                    stavke[menuIndex]?.duguje > 0 && ([
                        <MenuItem
                            key="expense"
                            onClick={() => {
                                const idx = menuIndex
                                const s = stavke[idx]
                                setMenuAnchor(null)
                                setMenuIndex(null)
                                onCreateExpense?.({
                                    statementKey: statement.key,
                                    index: idx,
                                    amount: s.duguje,
                                    currency: statement.valuta || 'RSD',
                                    datumValute: s.datumValute,
                                    nalogKorisnik: s.nalogKorisnik || '',
                                    opis: s.opis || '',
                                    partija: statement.partija,
                                })
                            }}
                        >
                            <ListItemIcon>
                                <Receipt fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Create expense</ListItemText>
                        </MenuItem>,
                        <MenuItem
                            key="gov-expense"
                            onClick={() => {
                                const idx = menuIndex
                                const s = stavke[idx]
                                setMenuAnchor(null)
                                setMenuIndex(null)
                                onCreateGovernmentExpense?.({
                                    statementKey: statement.key,
                                    index: idx,
                                    amount: s.duguje,
                                    currency: statement.valuta || 'RSD',
                                    datumValute: s.datumValute,
                                    nalogKorisnik: s.nalogKorisnik || '',
                                    opis: s.opis || '',
                                    partija: statement.partija,
                                })
                            }}
                        >
                            <ListItemIcon>
                                <AccountBalance fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Create government expense</ListItemText>
                        </MenuItem>,
                    ])}
            </Menu>
        </Dialog>
    )
}
