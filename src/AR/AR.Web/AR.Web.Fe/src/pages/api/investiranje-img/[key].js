import { firebaseApp } from '@/app/firebase'
import { get, getDatabase, ref } from 'firebase/database'

export default async function handler(req, res) {
    const { key } = req.query

    try {
        const db = getDatabase(firebaseApp)
        const snapshot = await get(ref(db, `/investiranje-images/${key}`))

        if (!snapshot.exists()) {
            return res.status(404).end()
        }

        const { data } = snapshot.val()
        // data is like "data:image/png;base64,iVBOR..."
        const matches = data.match(/^data:(.+);base64,(.+)$/)
        if (!matches) {
            return res.status(400).end()
        }

        const contentType = matches[1]
        const buffer = Buffer.from(matches[2], 'base64')

        res.setHeader('Content-Type', contentType)
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        res.status(200).send(buffer)
    } catch (error) {
        console.error(error)
        res.status(500).end()
    }
}
