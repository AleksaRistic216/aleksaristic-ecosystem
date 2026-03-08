import {
    Box,
    Chip,
    Dialog,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material'
import { Close } from '@mui/icons-material'

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

export const StatementPreview = ({ isOpen, onClose, statement }) => {
    if (!statement) return null

    const stavke = normalizeStavke(statement.stavke)

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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stavke.map((s, i) => (
                                <TableRow key={i} hover>
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
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    )
}
