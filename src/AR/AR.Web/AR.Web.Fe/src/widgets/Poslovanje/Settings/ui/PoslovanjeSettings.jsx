import { Box, Button, Tab, Tabs } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/app/context/AuthContext'
import { TemplateManager } from './TemplateManager'
import { ProviderSettings } from './ProviderSettings'
import { EmailSettings } from './EmailSettings'
import { ActionsSettings } from './ActionsSettings'

export const PoslovanjeSettings = () => {
    const { isAdmin } = useAuth()
    const router = useRouter()
    const [tab, setTab] = useState(0)

    if (!isAdmin) return null

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
                <Tab label="Templates" />
                <Tab label="Provider Info" />
                <Tab label="Email" />
                <Tab label="Actions" />
            </Tabs>
            {tab === 0 && <TemplateManager />}
            {tab === 1 && <ProviderSettings />}
            {tab === 2 && <EmailSettings />}
            {tab === 3 && <ActionsSettings />}
        </Box>
    )
}
