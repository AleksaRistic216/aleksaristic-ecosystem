import { useAuth } from '@/app/context/AuthContext'
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Typography,
} from '@mui/material'
import { AdminPanelSettings, Logout } from '@mui/icons-material'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { LoginModal } from './LoginModal'

export const AuthButton = (): JSX.Element => {
    const { user, loading, signOut, isAdmin } = useAuth()
    const [isLoginOpen, setIsLoginOpen] = useState(false)

    const handleSignOut = async () => {
        try {
            await signOut()
            toast('Signed out successfully', { type: 'success' })
        } catch (error: any) {
            toast(error.message || 'Failed to sign out', { type: 'error' })
        }
    }

    if (loading) {
        return <CircularProgress size={24} />
    }

    if (user) {
        return (
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                    bgcolor: 'grey.100',
                    borderRadius: 3,
                    px: 1.5,
                    py: 0.75,
                }}
            >
                <Avatar
                    src={user.photoURL || undefined}
                    sx={{
                        width: 28,
                        height: 28,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                    }}
                >
                    {user.email?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{ lineHeight: 1.2 }}
                    >
                        {user.displayName || user.email?.split('@')[0]}
                    </Typography>
                    {isAdmin && (
                        <Typography
                            variant="caption"
                            color="primary"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.25,
                            }}
                        >
                            <AdminPanelSettings sx={{ fontSize: 12 }} />
                            Admin
                        </Typography>
                    )}
                </Box>
                <Button
                    variant="text"
                    size="small"
                    onClick={handleSignOut}
                    startIcon={<Logout sx={{ fontSize: 16 }} />}
                    sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        minWidth: 'auto',
                        px: 1,
                        '&:hover': {
                            color: 'error.main',
                            bgcolor: 'error.lighter',
                        },
                    }}
                >
                    Sign Out
                </Button>
            </Stack>
        )
    }

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                onClick={() => setIsLoginOpen(true)}
                sx={{
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                }}
            >
                Sign In
            </Button>
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
            />
        </>
    )
}
