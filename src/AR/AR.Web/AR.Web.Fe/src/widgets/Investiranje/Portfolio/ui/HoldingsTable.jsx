import {
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
    Box,
} from '@mui/material'
import { HoldingsTableContainerStyled } from '../styled/HoldingsTableContainerStyled'

const formatCurrency = (value, currency = 'USD') => {
    const symbol = currency === 'GBP' ? '\u00A3' : '$'
    return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const PnlCell = ({ value, percent }) => {
    const color = value >= 0 ? '#4caf50' : '#f44336'
    return (
        <Box>
            <Typography
                variant="body2"
                sx={{ color, fontWeight: 500 }}
            >
                {formatCurrency(value)}
            </Typography>
            {percent !== undefined && (
                <Typography variant="caption" sx={{ color }}>
                    {percent.toFixed(2)}%
                </Typography>
            )}
        </Box>
    )
}

export const HoldingsTable = ({ holdings, isLoading }) => {
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
            </Box>
        )
    }

    if (!holdings || holdings.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                    Nema trenutnih pozicija
                </Typography>
            </Box>
        )
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0)
    const totalPnl = holdings.reduce((sum, h) => sum + h.pnl, 0)
    const totalCost = holdings.reduce((sum, h) => sum + h.avgPrice * h.shares, 0)
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

    return (
        <HoldingsTableContainerStyled component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        <TableCell>Ticker</TableCell>
                        <TableCell>Kompanija</TableCell>
                        <TableCell align="right">Akcije</TableCell>
                        <TableCell align="right">Prosečna cena</TableCell>
                        <TableCell align="right">Trenutna cena</TableCell>
                        <TableCell align="right">Uloženo</TableCell>
                        <TableCell align="right">Ukupna vrednost</TableCell>
                        <TableCell align="right">P&L</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {holdings.map((h) => (
                        <TableRow key={h.ticker}>
                            <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                    {h.ticker}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">
                                    {h.company}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">{h.shares.toFixed(2)}</TableCell>
                            <TableCell align="right">
                                {formatCurrency(h.avgPrice, h.currency)}
                            </TableCell>
                            <TableCell align="right">
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: h.currentPrice
                                            ? h.currentPrice >= h.avgPrice
                                                ? '#4caf50'
                                                : '#f44336'
                                            : 'text.primary',
                                    }}
                                >
                                    {h.currentPrice
                                        ? formatCurrency(h.currentPrice, h.currency)
                                        : '-'}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                {formatCurrency(h.avgPrice * h.shares, h.currency)}
                            </TableCell>
                            <TableCell align="right">
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: h.pnl >= 0 ? '#4caf50' : '#f44336',
                                        fontWeight: 500,
                                    }}
                                >
                                    {formatCurrency(h.totalValue, h.currency)}
                                </Typography>
                            </TableCell>
                            <TableCell align="right">
                                <PnlCell
                                    value={h.pnl}
                                    percent={h.pnlPercent}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow
                        sx={{
                            bgcolor: 'grey.50',
                            '& td': { fontWeight: 600 },
                        }}
                    >
                        <TableCell colSpan={5}>
                            <Typography variant="body2" fontWeight={600}>
                                Ukupno
                            </Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                                {formatCurrency(totalCost)}
                            </Typography>
                        </TableCell>
                        <TableCell align="right">
                            <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                    color: totalPnl >= 0 ? '#4caf50' : '#f44336',
                                }}
                            >
                                {formatCurrency(totalValue)}
                            </Typography>
                        </TableCell>
                        <TableCell align="right">
                            <PnlCell
                                value={totalPnl}
                                percent={totalPnlPercent}
                            />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </HoldingsTableContainerStyled>
    )
}
