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

    // Receivers
    onReceivers(callback) {
        return onValue(ref(db, '/poslovanje-receivers'), (snapshot) => {
            if (!snapshot.exists()) return callback([])
            const data = snapshot.val()
            callback(
                Object.entries(data).map(([key, val]) => ({ key, ...val })),
            )
        })
    },

    async createReceiver(receiver) {
        const newRef = push(ref(db, '/poslovanje-receivers'))
        await set(newRef, receiver)
        return newRef.key
    },

    async updateReceiver(key, receiver) {
        await update(ref(db, `/poslovanje-receivers/${key}`), receiver)
    },

    async deleteReceiver(key) {
        await remove(ref(db, `/poslovanje-receivers/${key}`))
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
}
