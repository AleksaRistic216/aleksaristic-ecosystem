import { Box, Button, ButtonGroup, CircularProgress, Typography } from '@mui/material'
import { PortfolioChartContainerStyled } from '../styled/PortfolioChartContainerStyled'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

const PERIODS = [
    { key: '1m', label: '1M' },
    { key: '3m', label: '3M' },
    { key: '6m', label: '6M' },
    { key: '1y', label: '1G' },
    { key: 'max', label: 'Sve' },
]

const fmt = (v) =>
    '$' +
    v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

const TransactionDot = (props) => {
    const { cx, cy, payload } = props
    const markers = []

    if (payload.hasBuy) markers.push('buy')
    if (payload.hasSell) markers.push('sell')
    if (payload.hasDividend) markers.push('div')

    if (markers.length === 0) return null

    if (markers.length === 1) {
        if (markers[0] === 'div') {
            return (
                <polygon
                    points={`${cx},${cy - 5} ${cx + 4},${cy} ${cx},${cy + 5} ${cx - 4},${cy}`}
                    fill="#1976d2"
                    stroke="white"
                    strokeWidth={1.5}
                />
            )
        }
        const color = markers[0] === 'buy' ? '#4caf50' : '#f44336'
        return <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />
    }

    // Multiple markers — space them out
    const offset = markers.length === 2 ? 5 : 7
    return (
        <g>
            {markers.map((m, i) => {
                const x = cx + (i - (markers.length - 1) / 2) * offset
                if (m === 'div') {
                    return (
                        <polygon
                            key={m}
                            points={`${x},${cy - 4} ${x + 3},${cy} ${x},${cy + 4} ${x - 3},${cy}`}
                            fill="#1976d2"
                            stroke="white"
                            strokeWidth={1}
                        />
                    )
                }
                const color = m === 'buy' ? '#4caf50' : '#f44336'
                return <circle key={m} cx={x} cy={cy} r={4} fill={color} stroke="white" strokeWidth={1.5} />
            })}
        </g>
    )
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const value = payload.find((p) => p.dataKey === 'value')
        const deposited = payload.find((p) => p.dataKey === 'selfDeposited')
        const dividends = payload.find((p) => p.dataKey === 'dividends')
        const dataPoint = payload[0]?.payload
        const diff =
            value && deposited ? value.value - deposited.value : 0
        const diffPercent =
            deposited && deposited.value > 0
                ? (diff / deposited.value) * 100
                : 0
        const color = diff >= 0 ? '#4caf50' : '#f44336'
        const sign = diff >= 0 ? '+' : ''

        return (
            <Box
                sx={{
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1.5,
                    boxShadow: 2,
                    minWidth: 160,
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                {value && (
                    <Typography variant="body2" fontWeight={600}>
                        Vrednost: {fmt(value.value)}
                    </Typography>
                )}
                {deposited && (
                    <Typography variant="body2" color="text.secondary">
                        Uloženo: {fmt(deposited.value)}
                    </Typography>
                )}
                {dividends && dividends.value != null && (
                    <Typography
                        variant="body2"
                        sx={{ color: '#1976d2' }}
                    >
                        Dividende: {fmt(dividends.value)}
                    </Typography>
                )}
                {value && deposited && (
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ color, mt: 0.5 }}
                    >
                        {sign}{fmt(diff)} ({sign}{diffPercent.toFixed(2)}%)
                    </Typography>
                )}
                {dataPoint?.hasBuy && (
                    <Typography
                        variant="caption"
                        sx={{ color: '#4caf50', fontWeight: 600, display: 'block', mt: 0.5 }}
                    >
                        ● Kupovina
                    </Typography>
                )}
                {dataPoint?.hasSell && (
                    <Typography
                        variant="caption"
                        sx={{ color: '#f44336', fontWeight: 600, display: 'block', mt: dataPoint?.hasBuy ? 0 : 0.5 }}
                    >
                        ● Prodaja
                    </Typography>
                )}
                {dataPoint?.hasDividend && (
                    <Typography
                        variant="caption"
                        sx={{ color: '#1976d2', fontWeight: 600, display: 'block', mt: (dataPoint?.hasBuy || dataPoint?.hasSell) ? 0 : 0.5 }}
                    >
                        ◆ Isplata dividende
                    </Typography>
                )}
            </Box>
        )
    }
    return null
}

export const PortfolioChart = ({ data, period, onPeriodChange, isLoading }) => {
    return (
        <PortfolioChartContainerStyled>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Typography variant="subtitle1" fontWeight={600}>
                    Vrednost portfolija
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                    {PERIODS.map((p) => (
                        <Button
                            key={p.key}
                            onClick={() => onPeriodChange(p.key)}
                            variant={
                                period === p.key ? 'contained' : 'outlined'
                            }
                            sx={{ textTransform: 'none', minWidth: 40 }}
                        >
                            {p.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </Box>
            {isLoading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 300,
                    }}
                >
                    <CircularProgress size={32} />
                </Box>
            ) : data.length === 0 ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 300,
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        Nema podataka za prikaz
                    </Typography>
                </Box>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `$${v.toLocaleString()}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="top"
                            align="left"
                            iconType="line"
                            wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            name="Vrednost"
                            stroke="#000"
                            strokeWidth={2}
                            dot={<TransactionDot />}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                        <Line
                            type="stepAfter"
                            dataKey="selfDeposited"
                            name="Uloženo"
                            stroke="#9e9e9e"
                            strokeWidth={1.5}
                            strokeDasharray="6 3"
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="dividends"
                            name="Dividende"
                            stroke="#1976d2"
                            strokeWidth={1.5}
                            strokeDasharray="4 3"
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                            connectNulls
                        />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </PortfolioChartContainerStyled>
    )
}
