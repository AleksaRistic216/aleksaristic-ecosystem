import { poslovanjService } from '@/app/services/poslovanjService'
import { Box, Button, Typography } from '@mui/material'
import { DeleteSweep } from '@mui/icons-material'
import { useState } from 'react'
import { toast } from 'react-toastify'

export const ActionsSettings = () => {
    const [loading, setLoading] = useState(false)

    const handleClearSentTracking = async () => {
        if (
            !confirm(
                'Clear all envelope sent tracking history? This will remove send dates from all invoices and statements. This cannot be undone.',
            )
        )
            return

        setLoading(true)
        try {
            const cleared = await poslovanjService.clearEnvelopeSentTracking()
            if (cleared > 0) {
                toast(`Cleared sent tracking (${cleared} items)`, {
                    type: 'success',
                })
            } else {
                toast('No sent tracking to clear', { type: 'info' })
            }
        } catch (error) {
            toast('Failed to clear sent tracking', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
            </Typography>
            <Box
                sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                }}
            >
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Clear Envelope Sent Tracking
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    Remove all send history from invoice attachments and bank
                    statements. Items will appear as unsent in the envelope
                    view.
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<DeleteSweep />}
                    onClick={handleClearSentTracking}
                    disabled={loading}
                    sx={{
                        textTransform: 'none',
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        '&:hover': {
                            borderColor: '#b71c1c',
                            bgcolor: 'rgba(211,47,47,0.04)',
                        },
                    }}
                >
                    {loading
                        ? 'Clearing...'
                        : 'Clear Envelope Sent Tracking'}
                </Button>
            </Box>
        </Box>
    )
}
