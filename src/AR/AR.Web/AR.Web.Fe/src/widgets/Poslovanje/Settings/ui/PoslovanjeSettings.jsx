import { Box, Button, Tab, Tabs } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/app/context/AuthContext'
import { ReceiverManager } from './ReceiverManager'
import { TemplateManager } from './TemplateManager'
import { ProviderSettings } from './ProviderSettings'
import { EmailSettings } from './EmailSettings'

export const PoslovanjeSettings = () => {
    const { isAdmin } = useAuth()
    const [tab, setTab] = useState(0)

    if (!isAdmin) return null

    const router = useRouter()

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', py: 4, px: 2 }}>
            <Button
                startIcon={<ArrowBack />}
                onClick={() => router.push('/poslovanje')}
                sx={{ textTransform: 'none', mb: 2 }}
            >
                Back
            </Button>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="Receivers" />
                <Tab label="Templates" />
                <Tab label="Provider Info" />
                <Tab label="Email" />
            </Tabs>
            {tab === 0 && <ReceiverManager />}
            {tab === 1 && <TemplateManager />}
            {tab === 2 && <ProviderSettings />}
            {tab === 3 && <EmailSettings />}
        </Box>
    )
}
