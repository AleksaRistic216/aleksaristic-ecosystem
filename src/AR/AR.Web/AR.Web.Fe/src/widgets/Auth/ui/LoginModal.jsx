import { useAuth } from '@/app/context/AuthContext'
import { Close, Google, LockOutlined } from '@mui/icons-material'
import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    Divider,
    IconButton,
    TextField,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import { toast } from 'react-toastify'

export const LoginModal = ({ isOpen, onClose }) => {
    const { signIn, signInWithGoogle } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleEmailSignIn = async () => {
        if (!email || !password) {
            toast('Please enter email and password', { type: 'warning' })
            return
        }

        setLoading(true)
        try {
            await signIn(email, password)
            toast('Signed in successfully', { type: 'success' })
            onClose()
        } catch (error) {
            toast(error.message || 'Failed to sign in', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        try {
            await signInWithGoogle()
            toast('Signed in successfully', { type: 'success' })
            onClose()
        } catch (error) {
            toast(error.message || 'Failed to sign in with Google', {
                type: 'error',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (loading) return
        setEmail('')
        setPassword('')
        onClose()
    }

    return (
        <Dialog
            open={isOpen}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                },
            }}
        >
            <IconButton
                onClick={handleClose}
                disabled={loading}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'grey.500',
                }}
            >
                <Close />
            </IconButton>
            <DialogContent sx={{ pt: 4, pb: 4, px: 4 }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 3,
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: 'primary.main',
                            width: 56,
                            height: 56,
                            mb: 2,
                        }}
                    >
                        <LockOutlined fontSize="large" />
                    </Avatar>
                    <Typography variant="h5" fontWeight={600}>
                        Admin Sign In
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                    >
                        Sign in to manage blog posts
                    </Typography>
                </Box>

                <Box
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleEmailSignIn()
                    }}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        size="medium"
                        autoFocus
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        size="medium"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        size="large"
                        sx={{
                            mt: 1,
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                        }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Sign In'
                        )}
                    </Button>
                </Box>

                <Divider sx={{ my: 3 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ px: 1 }}
                    >
                        or
                    </Typography>
                </Divider>

                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={
                        loading ? null : (
                            <Google sx={{ color: '#4285f4' }} />
                        )
                    }
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    size="large"
                    sx={{
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderColor: 'grey.300',
                        color: 'text.primary',
                        '&:hover': {
                            borderColor: 'grey.400',
                            bgcolor: 'grey.50',
                        },
                    }}
                >
                    {loading ? (
                        <CircularProgress size={24} />
                    ) : (
                        'Continue with Google'
                    )}
                </Button>
            </DialogContent>
        </Dialog>
    )
}
