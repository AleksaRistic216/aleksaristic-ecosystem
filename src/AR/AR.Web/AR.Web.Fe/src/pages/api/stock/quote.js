import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey'],
})

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { symbols } = req.query
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

    try {
        const results = await Promise.allSettled(
            tickers.map((ticker) => yahooFinance.quote(ticker))
        )

        const quotes = {}
        results.forEach((result, index) => {
            const ticker = tickers[index]
            if (result.status === 'fulfilled' && result.value) {
                const q = result.value
                quotes[ticker] = {
                    price: q.regularMarketPrice,
                    open: q.regularMarketOpen,
                    change: q.regularMarketChange,
                    changePercent: q.regularMarketChangePercent,
                    currency: q.currency,
                    name: q.shortName || q.longName,
                }
            }
        })

        res.setHeader(
            'Cache-Control',
            's-maxage=60, stale-while-revalidate=300'
        )
        return res.status(200).json({ quotes })
    } catch (error) {
        console.error('Quote API error:', error)
        return res.status(500).json({ error: 'Failed to fetch quotes' })
    }
}
