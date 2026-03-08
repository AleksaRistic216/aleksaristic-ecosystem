import { poslovanjService } from '@/app/services/poslovanjService'
import { Box, Button, Grid, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const defaultSettings = {
    senderEmail: '',
    appPassword: '',
    bookkeeperEmail: '',
}

export const EmailSettings = () => {
    const [form, setForm] = useState(defaultSettings)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        return poslovanjService.onEmailSettings((data) => {
            if (data) setForm({ ...defaultSettings, ...data })
        })
    }, [])

    const handleSave = async () => {
        setLoading(true)
        try {
            await poslovanjService.updateEmailSettings(form)
            toast('Email settings saved', { type: 'success' })
        } catch (error) {
            toast('Failed to save', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const f = (field) => ({
        value: form[field] || '',
        onChange: (e) =>
            setForm((prev) => ({ ...prev, [field]: e.target.value })),
        disabled: loading,
        size: 'small',
    })

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Email Configuration
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
            >
                Configure Gmail credentials for sending envelopes to your
                bookkeeper. Use a Gmail App Password (Google Account &rarr;
                Security &rarr; App Passwords).
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        label="Your Gmail Address"
                        fullWidth
                        {...f('senderEmail')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Gmail App Password"
                        fullWidth
                        type="password"
                        {...f('appPassword')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Bookkeeper Email"
                        fullWidth
                        {...f('bookkeeperEmail')}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                    >
                        {loading ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}
