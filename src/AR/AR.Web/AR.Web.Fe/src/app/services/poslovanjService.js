import {
    get,
    getDatabase,
    push,
    ref,
    remove,
    set,
    update,
    onValue,
} from 'firebase/database'
import { firebaseApp } from '../firebase'

const db = getDatabase(firebaseApp)

const normalizeStavke = (stavke) => {
    if (!stavke) return []
    if (Array.isArray(stavke)) return stavke
    return Object.values(stavke)
}

const checkTransactionCapacity = async (txRef, newAmount, exclude = {}) => {
    const [stmtKey, idxStr] = txRef.split('::')
    const idx = Number(idxStr)

    const [stmtSnap, expSnap, govSnap, invSnap, forexSnap] = await Promise.all([
        get(ref(db, `/poslovanje-statements/${stmtKey}`)),
        get(ref(db, '/poslovanje-expenses')),
        get(ref(db, '/poslovanje-government-expenses')),
        get(ref(db, '/poslovanje-invoices')),
        get(ref(db, '/poslovanje-forex-exchanges')),
    ])

    if (!stmtSnap.exists()) throw new Error('Statement not found')
    const stmt = stmtSnap.val()
    const stavke = normalizeStavke(stmt.stavke)
    const stavka = stavke[idx]
    if (!stavka) throw new Error('Transaction not found')

    const capacity = stavka.duguje > 0 ? stavka.duguje : stavka.potrazuje
    let used = 0

    if (expSnap.exists()) {
        Object.entries(expSnap.val()).forEach(([k, e]) => {
            if (k !== exclude.expenseKey && e.transactionRef === txRef)
                used += e.amount || 0
        })
    }

    if (govSnap.exists()) {
        Object.entries(govSnap.val()).forEach(([k, e]) => {
            if (k !== exclude.govExpenseKey && e.transactionRef === txRef)
                used += e.amount || 0
        })
    }

    if (invSnap.exists()) {
        Object.entries(invSnap.val()).forEach(([k, inv]) => {
            if (
                k !== exclude.invoiceKey &&
                inv.linkedStatement?.statementKey === stmtKey &&
                Number(inv.linkedStatement?.stavkaIndex) === idx
            )
                used += inv.totalAmount || 0
        })
    }

    if (forexSnap.exists()) {
        Object.entries(forexSnap.val()).forEach(([k, fx]) => {
            if (k === exclude.forexKey) return
            const txns = fx.transactions
                ? Array.isArray(fx.transactions)
                    ? fx.transactions
                    : Object.values(fx.transactions)
                : []
            txns.forEach((t) => {
                if (t.ref === txRef) used += t.amount || 0
            })
        })
    }

    const remaining = capacity - used
    if (newAmount > remaining + 0.01) {
        throw new Error(
            `Transaction capacity exceeded: ${newAmount.toFixed(2)} requested, ${remaining.toFixed(2)} remaining of ${capacity.toFixed(2)}`,
        )
    }
}

export const poslovanjService = {
    // Invoices
    onInvoices(callback) {
        return onValue(ref(db, '/poslovanje-invoices'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createInvoice(invoice) {
        const newRef = push(ref(db, '/poslovanje-invoices'))
        await set(newRef, { ...invoice, createdAt: Date.now() })
        return newRef.key
    },

    async updateInvoice(key, invoice) {
        await update(ref(db, `/poslovanje-invoices/${key}`), {
            ...invoice,
            updatedAt: Date.now(),
        })
    },

    async deleteInvoice(key) {
        await remove(ref(db, `/poslovanje-invoices/${key}`))
    },

    async linkInvoiceToStatement(invoiceKey, link) {
        const txRef = `${link.statementKey}::${link.stavkaIndex}`
        const invSnap = await get(ref(db, `/poslovanje-invoices/${invoiceKey}`))
        const amount = invSnap.exists() ? invSnap.val().totalAmount || 0 : 0
        await checkTransactionCapacity(txRef, amount, { invoiceKey })
        await update(ref(db, `/poslovanje-invoices/${invoiceKey}`), {
            linkedStatement: link,
            updatedAt: Date.now(),
        })
    },

    async unlinkInvoiceFromStatement(invoiceKey) {
        await update(ref(db, `/poslovanje-invoices/${invoiceKey}`), {
            linkedStatement: null,
            updatedAt: Date.now(),
        })
    },

    async addAttachment(invoiceKey, file) {
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
        const newRef = push(
            ref(db, `/poslovanje-invoices/${invoiceKey}/attachments`),
        )
        const doc = {
            data,
            name: file.name,
            type: file.type,
            uploadedAt: Date.now(),
        }
        await set(newRef, doc)
        await update(ref(db, `/poslovanje-invoices/${invoiceKey}`), {
            updatedAt: Date.now(),
        })
        return { key: newRef.key, ...doc }
    },

    async markAttachmentSent(invoiceKey, attachmentKey, sentTo) {
        const historyRef = push(
            ref(
                db,
                `/poslovanje-invoices/${invoiceKey}/attachments/${attachmentKey}/sendHistory`,
            ),
        )
        await set(historyRef, { sentAt: Date.now(), sentTo })
    },

    async removeAttachment(invoiceKey, attachmentKey) {
        await remove(
            ref(
                db,
                `/poslovanje-invoices/${invoiceKey}/attachments/${attachmentKey}`,
            ),
        )
        await update(ref(db, `/poslovanje-invoices/${invoiceKey}`), {
            updatedAt: Date.now(),
        })
    },

    // Templates
    onTemplates(callback) {
        return onValue(ref(db, '/poslovanje-templates'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createTemplate(template) {
        const newRef = push(ref(db, '/poslovanje-templates'))
        await set(newRef, { ...template, createdAt: Date.now() })
        return newRef.key
    },

    async updateTemplate(key, template) {
        await update(ref(db, `/poslovanje-templates/${key}`), {
            ...template,
            updatedAt: Date.now(),
        })
    },

    async deleteTemplate(key) {
        await remove(ref(db, `/poslovanje-templates/${key}`))
    },

    // Provider (singleton)
    onProvider(callback) {
        return onValue(ref(db, '/poslovanje-provider'), (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null)
        })
    },

    async updateProvider(provider) {
        await set(ref(db, '/poslovanje-provider'), provider)
    },

    // Email settings (singleton)
    onEmailSettings(callback) {
        return onValue(ref(db, '/poslovanje-email-settings'), (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null)
        })
    },

    async updateEmailSettings(settings) {
        await set(ref(db, '/poslovanje-email-settings'), settings)
    },

    // Bank statements
    onStatements(callback) {
        return onValue(ref(db, '/poslovanje-statements'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createStatement(statement) {
        const newRef = push(ref(db, '/poslovanje-statements'))
        await set(newRef, { ...statement, importedAt: Date.now() })
        return newRef.key
    },

    async markStatementSent(key, sentTo) {
        const historyRef = push(
            ref(db, `/poslovanje-statements/${key}/sendHistory`),
        )
        await set(historyRef, { sentAt: Date.now(), sentTo })
    },

    async deleteStatement(key) {
        await remove(ref(db, `/poslovanje-statements/${key}`))
    },

    // Transaction-to-partner direct mappings
    onTransactionPartners(callback) {
        return onValue(
            ref(db, '/poslovanje-transaction-partners'),
            (snapshot) => {
                if (!snapshot.exists()) return callback([])
                const data = snapshot.val()
                callback(
                    Object.entries(data).map(([key, val]) => ({
                        key,
                        ...val,
                    })),
                )
            },
        )
    },

    async linkTransactionToPartner(transactionRef, partnerKey, partnerName) {
        const newRef = push(ref(db, '/poslovanje-transaction-partners'))
        await set(newRef, {
            transactionRef,
            partnerKey,
            partnerName,
            createdAt: Date.now(),
        })
        return newRef.key
    },

    async unlinkTransactionFromPartner(key) {
        await remove(ref(db, `/poslovanje-transaction-partners/${key}`))
    },

    // Expenses
    onExpenses(callback) {
        return onValue(ref(db, '/poslovanje-expenses'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createExpense(expense) {
        const newRef = push(ref(db, '/poslovanje-expenses'))
        await set(newRef, { ...expense, createdAt: Date.now() })
        return newRef.key
    },

    async updateExpense(key, expense) {
        if (expense.transactionRef) {
            let amount = expense.amount
            if (amount == null) {
                const snap = await get(ref(db, `/poslovanje-expenses/${key}`))
                if (snap.exists()) amount = snap.val().amount || 0
            }
            await checkTransactionCapacity(expense.transactionRef, amount || 0, {
                expenseKey: key,
            })
        }
        await update(ref(db, `/poslovanje-expenses/${key}`), {
            ...expense,
            updatedAt: Date.now(),
        })
    },

    async deleteExpense(key) {
        await remove(ref(db, `/poslovanje-expenses/${key}`))
    },

    async addExpenseAttachment(expenseKey, file) {
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
        const newRef = push(
            ref(db, `/poslovanje-expenses/${expenseKey}/attachments`),
        )
        const doc = {
            data,
            name: file.name,
            type: file.type,
            uploadedAt: Date.now(),
        }
        await set(newRef, doc)
        return { key: newRef.key, ...doc }
    },

    async removeExpenseAttachment(expenseKey, attachmentKey) {
        await remove(
            ref(
                db,
                `/poslovanje-expenses/${expenseKey}/attachments/${attachmentKey}`,
            ),
        )
    },

    // Employees
    onEmployees(callback) {
        return onValue(ref(db, '/poslovanje-employees'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createEmployee(employee) {
        const newRef = push(ref(db, '/poslovanje-employees'))
        await set(newRef, { ...employee, createdAt: Date.now() })
        return newRef.key
    },

    async updateEmployee(key, employee) {
        await update(ref(db, `/poslovanje-employees/${key}`), {
            ...employee,
            updatedAt: Date.now(),
        })
    },

    async deleteEmployee(key) {
        await remove(ref(db, `/poslovanje-employees/${key}`))
    },

    // Employee transactions
    onEmployeeTransactions(callback) {
        return onValue(
            ref(db, '/poslovanje-employee-transactions'),
            (snapshot) => {
                if (!snapshot.exists()) return callback([])
                const data = snapshot.val()
                callback(
                    Object.entries(data).map(([key, val]) => ({
                        key,
                        ...val,
                    })),
                )
            },
        )
    },

    async createEmployeeTransaction(transaction) {
        const newRef = push(ref(db, '/poslovanje-employee-transactions'))
        await set(newRef, { ...transaction, createdAt: Date.now() })
        return newRef.key
    },

    async updateEmployeeTransaction(key, transaction) {
        await update(ref(db, `/poslovanje-employee-transactions/${key}`), {
            ...transaction,
            updatedAt: Date.now(),
        })
    },

    async deleteEmployeeTransaction(key) {
        await remove(ref(db, `/poslovanje-employee-transactions/${key}`))
    },

    async addEmployeeTransactionAttachment(txKey, file) {
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
        const newRef = push(
            ref(
                db,
                `/poslovanje-employee-transactions/${txKey}/attachments`,
            ),
        )
        const doc = {
            data,
            name: file.name,
            type: file.type,
            uploadedAt: Date.now(),
        }
        await set(newRef, doc)
        return { key: newRef.key, ...doc }
    },

    async removeEmployeeTransactionAttachment(txKey, attachmentKey) {
        await remove(
            ref(
                db,
                `/poslovanje-employee-transactions/${txKey}/attachments/${attachmentKey}`,
            ),
        )
    },

    // Partners
    onPartners(callback) {
        return onValue(ref(db, '/poslovanje-partners'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createPartner(partner) {
        const newRef = push(ref(db, '/poslovanje-partners'))
        await set(newRef, { ...partner, createdAt: Date.now() })
        return newRef.key
    },

    async updatePartner(key, partner) {
        await update(ref(db, `/poslovanje-partners/${key}`), {
            ...partner,
            updatedAt: Date.now(),
        })
    },

    async deletePartner(key) {
        await remove(ref(db, `/poslovanje-partners/${key}`))
    },

    // Government expenses
    onGovernmentExpenses(callback) {
        return onValue(
            ref(db, '/poslovanje-government-expenses'),
            (snapshot) => {
                if (!snapshot.exists()) return callback([])
                const data = snapshot.val()
                callback(
                    Object.entries(data).map(([key, val]) => ({
                        key,
                        ...val,
                    })),
                )
            },
        )
    },

    async createGovernmentExpense(expense) {
        const newRef = push(ref(db, '/poslovanje-government-expenses'))
        await set(newRef, { ...expense, createdAt: Date.now() })
        return newRef.key
    },

    async updateGovernmentExpense(key, expense) {
        if (expense.transactionRef) {
            let amount = expense.amount
            if (amount == null) {
                const snap = await get(
                    ref(db, `/poslovanje-government-expenses/${key}`),
                )
                if (snap.exists()) amount = snap.val().amount || 0
            }
            await checkTransactionCapacity(expense.transactionRef, amount || 0, {
                govExpenseKey: key,
            })
        }
        await update(ref(db, `/poslovanje-government-expenses/${key}`), {
            ...expense,
            updatedAt: Date.now(),
        })
    },

    async deleteGovernmentExpense(key) {
        await remove(ref(db, `/poslovanje-government-expenses/${key}`))
    },

    async addGovernmentExpenseAttachment(expenseKey, file) {
        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
        const newRef = push(
            ref(
                db,
                `/poslovanje-government-expenses/${expenseKey}/attachments`,
            ),
        )
        const doc = {
            data,
            name: file.name,
            type: file.type,
            uploadedAt: Date.now(),
        }
        await set(newRef, doc)
        return { key: newRef.key, ...doc }
    },

    async removeGovernmentExpenseAttachment(expenseKey, attachmentKey) {
        await remove(
            ref(
                db,
                `/poslovanje-government-expenses/${expenseKey}/attachments/${attachmentKey}`,
            ),
        )
    },

    // Forex exchanges
    onForexExchanges(callback) {
        return onValue(
            ref(db, '/poslovanje-forex-exchanges'),
            (snapshot) => {
                if (!snapshot.exists()) return callback([])
                const data = snapshot.val()
                callback(
                    Object.entries(data).map(([key, val]) => ({
                        key,
                        ...val,
                    })),
                )
            },
        )
    },

    async createForexExchange(exchange) {
        const txns = exchange.transactions
            ? Array.isArray(exchange.transactions)
                ? exchange.transactions
                : Object.values(exchange.transactions)
            : []
        for (const t of txns) {
            if (t.ref) {
                await checkTransactionCapacity(t.ref, t.amount || 0)
            }
        }
        const newRef = push(ref(db, '/poslovanje-forex-exchanges'))
        await set(newRef, { ...exchange, createdAt: Date.now() })
        return newRef.key
    },

    async deleteForexExchange(key) {
        await remove(ref(db, `/poslovanje-forex-exchanges/${key}`))
    },
}
