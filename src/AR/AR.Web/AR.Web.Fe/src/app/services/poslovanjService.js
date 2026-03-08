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
}
