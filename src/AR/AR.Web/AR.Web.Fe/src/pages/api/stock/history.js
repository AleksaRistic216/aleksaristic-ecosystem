import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical'],
})

const PERIOD_MAP = {
    '1m': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
    max: 3650,
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { symbols, period = '1y' } = req.query
    if (!symbols) {
        return res.status(400).json({ error: 'symbols parameter is required' })
    }

    const tickers = symbols
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

    if (tickers.length === 0) {
        return res.status(400).json({ error: 'No valid symbols provided' })
    }

    const days = PERIOD_MAP[period] || 365
    const period1 = new Date()
    period1.setDate(period1.getDate() - days)

    try {
        const results = await Promise.allSettled(
            tickers.map((ticker) =>
                yahooFinance.chart(ticker, {
                    period1,
                    interval: '1d',
                })
            )
        )

        const history = {}
        results.forEach((result, index) => {
            const ticker = tickers[index]
            if (result.status === 'fulfilled' && result.value?.quotes) {
                history[ticker] = result.value.quotes
                    .filter((item) => item.close != null)
                    .map((item) => ({
                        date: item.date.toISOString().split('T')[0],
                        close: item.close,
                    }))
            }
        })

        res.setHeader(
            'Cache-Control',
            's-maxage=3600, stale-while-revalidate=7200'
        )
        return res.status(200).json({ history })
    } catch (error) {
        console.error('History API error:', error)
        return res.status(500).json({ error: 'Failed to fetch history' })
    }
}
