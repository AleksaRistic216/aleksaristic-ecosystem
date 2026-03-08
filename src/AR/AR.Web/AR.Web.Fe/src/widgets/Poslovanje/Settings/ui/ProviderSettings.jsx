import { poslovanjService } from '@/app/services/poslovanjService'
import { Box, Button, Grid, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const defaultProvider = {
    name: '',
    address: '',
    city: '',
    email: '',
    directorName: '',
    directorNameCyrillic: '',
    bankName: '',
    bankAddress: '',
    bic: '',
    iban: '',
}

export const ProviderSettings = () => {
    const [form, setForm] = useState(defaultProvider)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        return poslovanjService.onProvider((data) => {
            if (data) setForm({ ...defaultProvider, ...data })
        })
    }, [])

    const handleSave = async () => {
        setLoading(true)
        try {
            await poslovanjService.updateProvider(form)
            toast('Provider info saved', { type: 'success' })
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
                Provider Information
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
            >
                This info is available in templates as{' '}
                {'{{provider.fieldName}}'}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <TextField
                        label="Company Name"
                        fullWidth
                        {...f('name')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Email" fullWidth {...f('email')} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="Address" fullWidth {...f('address')} />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="City" fullWidth {...f('city')} />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Director Name"
                        fullWidth
                        {...f('directorName')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Director Name (Cyrillic)"
                        fullWidth
                        {...f('directorNameCyrillic')}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                    >
                        Bank Details
                    </Typography>
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Bank Name"
                        fullWidth
                        {...f('bankName')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="Bank Address"
                        fullWidth
                        {...f('bankAddress')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        label="BIC / SWIFT"
                        fullWidth
                        {...f('bic')}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField label="IBAN" fullWidth {...f('iban')} />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loading}
                        sx={{ textTransform: 'none' }}
                    >
                        {loading ? 'Saving...' : 'Save Provider Info'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    )
}
