import nodemailer from 'nodemailer'

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { senderEmail, appPassword, bookkeeperEmail, subject, body, attachments } = req.body

    if (!senderEmail || !appPassword || !bookkeeperEmail) {
        return res.status(400).json({ error: 'Missing email configuration' })
    }

    if (!attachments || attachments.length === 0) {
        return res.status(400).json({ error: 'No attachments to send' })
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: senderEmail,
            pass: appPassword,
        },
    })

    const mailAttachments = attachments.map((att) => {
        const matches = att.data.match(/^data:([^;]+);base64,(.+)$/)
        if (!matches) {
            return { filename: att.name, content: att.data }
        }
        return {
            filename: att.name,
            content: matches[2],
            encoding: 'base64',
            contentType: matches[1],
        }
    })

    try {
        await transporter.sendMail({
            from: senderEmail,
            to: bookkeeperEmail,
            subject: subject || 'Invoice Documents',
            text: body || '',
            attachments: mailAttachments,
        })
        return res.status(200).json({ success: true })
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }
}
