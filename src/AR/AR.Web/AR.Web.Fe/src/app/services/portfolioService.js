import {
    get,
    getDatabase,
    push,
    ref,
    remove,
    set,
    update,
} from 'firebase/database'
import { firebaseApp } from '../firebase'

const db = getDatabase(firebaseApp)

export const portfolioService = {
    // Portfolio configs
    async getPortfolios() {
        const snapshot = await get(ref(db, '/portfolio/configs'))
        if (snapshot.exists()) {
            const data = snapshot.val()
            return Object.keys(data)
                .filter((key) => data[key] != null)
                .map((key) => ({
                    key,
                    data: data[key],
                }))
                .sort((a, b) => (a.data.createdAt || 0) - (b.data.createdAt || 0))
        }
        return []
    },

    async createPortfolio(name, description = '') {
        const configRef = push(ref(db, '/portfolio/configs'))
        await set(configRef, {
            name,
            description,
            createdAt: Date.now(),
        })
        return configRef.key
    },

    async updatePortfolio(key, fields) {
        await update(ref(db, `/portfolio/configs/${key}`), fields)
    },

    async deletePortfolio(key) {
        // Delete config and all its transactions
        await remove(ref(db, `/portfolio/configs/${key}`))
        await remove(ref(db, `/portfolio/transactions/${key}`))
    },

    // Transactions scoped by portfolioId
    async getTransactions(portfolioId) {
        const snapshot = await get(
            ref(db, `/portfolio/transactions/${portfolioId}`)
        )
        if (snapshot.exists()) {
            const data = snapshot.val()
            return Object.keys(data)
                .filter((key) => data[key] != null)
                .map((key) => ({
                    key,
                    data: data[key],
                }))
                .sort((a, b) => (a.data.createdAt || 0) - (b.data.createdAt || 0))
        }
        return []
    },

    async createTransaction(portfolioId, tx) {
        const txRef = push(ref(db, `/portfolio/transactions/${portfolioId}`))
        await set(txRef, {
            ...tx,
            createdAt: Date.now(),
        })
        return txRef.key
    },

    async updateTransaction(portfolioId, key, tx) {
        const txRef = ref(db, `/portfolio/transactions/${portfolioId}/${key}`)
        await update(txRef, tx)
    },

    async deleteTransaction(portfolioId, key) {
        const txRef = ref(db, `/portfolio/transactions/${portfolioId}/${key}`)
        await remove(txRef)
    },

    async deleteAllTransactions(portfolioId) {
        await remove(ref(db, `/portfolio/transactions/${portfolioId}`))
    },
}
