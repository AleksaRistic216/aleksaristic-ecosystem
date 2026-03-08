import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { Add, Close, Delete, Star, StarBorder } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const migrateBankAccounts = (employee) => {
    if (employee.bankAccounts && Array.isArray(employee.bankAccounts)) {
        return employee.bankAccounts
    }
    if (employee.bankAccount) {
        return [{ account: employee.bankAccount, primary: true }]
    }
    return []
}

export const EmployeeDialog = ({ isOpen, onClose, employee, partners = [] }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [name, setName] = useState('')
    const [position, setPosition] = useState('')
    const [bankAccounts, setBankAccounts] = useState([])
    const [newAccount, setNewAccount] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [partnerKey, setPartnerKey] = useState('')
    const [saving, setSaving] = useState(false)

    const isEdit = !!employee

    useEffect(() => {
        if (employee) {
            setName(employee.name || '')
            setPosition(employee.position || '')
            setBankAccounts(migrateBankAccounts(employee))
            setEmail(employee.email || '')
            setPhone(employee.phone || '')
            setPartnerKey(employee.partnerKey || '')
        } else {
            setName('')
            setPosition('')
            setBankAccounts([])
            setEmail('')
            setPhone('')
            setPartnerKey('')
        }
        setNewAccount('')
    }, [employee, isOpen])

    const handleAddAccount = () => {
        const trimmed = newAccount.trim()
        if (!trimmed) return
        if (bankAccounts.some((a) => a.account === trimmed)) {
            toast('Account already added', { type: 'warning' })
            return
        }
        setBankAccounts((prev) => [
            ...prev,
            { account: trimmed, primary: prev.length === 0 },
        ])
        setNewAccount('')
    }

    const handleRemoveAccount = (index) => {
        setBankAccounts((prev) => {
            const next = prev.filter((_, i) => i !== index)
            if (next.length > 0 && !next.some((a) => a.primary)) {
                next[0].primary = true
            }
            return next
        })
    }

    const handleSetPrimary = (index) => {
        setBankAccounts((prev) =>
            prev.map((a, i) => ({ ...a, primary: i === index })),
        )
    }

    const handleSave = async () => {
        if (!name.trim()) {
            toast('Name is required', { type: 'warning' })
            return
        }
        if (!partnerKey) {
            toast('Partner is required', { type: 'warning' })
            return
        }
        setSaving(true)
        try {
            const primary = bankAccounts.find((a) => a.primary)
            const data = {
                name: name.trim(),
                position: position.trim(),
                bankAccount: primary?.account || '',
                bankAccounts,
                email: email.trim(),
                phone: phone.trim(),
                partnerKey: partnerKey || '',
            }
            if (isEdit) {
                await poslovanjService.updateEmployee(employee.key, data)
            } else {
                await poslovanjService.createEmployee(data)
            }
            toast(isEdit ? 'Employee updated' : 'Employee created', {
                type: 'success',
            })
            onClose()
        } catch (error) {
            toast('Failed to save employee', { type: 'error' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            fullWidth
            fullScreen={isMobile}
            maxWidth="sm"
            PaperProps={{ sx: isMobile ? {} : { borderRadius: 3 } }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                {isEdit ? 'Edit Employee' : 'New Employee'}
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    label="Full Name"
                    fullWidth
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ mb: 2, mt: 1 }}
                    autoFocus
                />
                <TextField
                    label="Position"
                    fullWidth
                    size="small"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <FormControl fullWidth size="small" sx={{ mb: 2 }} required>
                    <InputLabel>Partner</InputLabel>
                    <Select
                        value={partnerKey}
                        label="Partner"
                        onChange={(e) =>
                            setPartnerKey(e.target.value)
                        }
                    >
                        {partners.map((p) => (
                            <MenuItem key={p.key} value={p.key}>
                                {p.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <InputLabel sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                    Bank Accounts
                </InputLabel>
                {bankAccounts.length > 0 && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            mb: 1,
                        }}
                    >
                        {bankAccounts.map((acc, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    p: 0.5,
                                    pl: 1,
                                    border: 1,
                                    borderColor: acc.primary
                                        ? 'primary.main'
                                        : 'divider',
                                    borderRadius: 1,
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{ flex: 1, fontFamily: 'monospace' }}
                                >
                                    {acc.account}
                                </Typography>
                                {acc.primary && (
                                    <Chip
                                        label="Primary"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                                <IconButton
                                    size="small"
                                    onClick={() => handleSetPrimary(i)}
                                    title="Set as primary"
                                    sx={{
                                        color: acc.primary
                                            ? '#ed6c02'
                                            : 'action.disabled',
                                    }}
                                >
                                    {acc.primary ? (
                                        <Star fontSize="small" />
                                    ) : (
                                        <StarBorder fontSize="small" />
                                    )}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => handleRemoveAccount(i)}
                                    sx={{ color: '#d32f2f' }}
                                >
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                        placeholder="Add account number..."
                        size="small"
                        fullWidth
                        value={newAccount}
                        onChange={(e) => setNewAccount(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddAccount()
                            }
                        }}
                    />
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleAddAccount}
                        sx={{ textTransform: 'none', minWidth: 'auto' }}
                    >
                        <Add fontSize="small" />
                    </Button>
                </Box>

                <TextField
                    label="Email"
                    fullWidth
                    size="small"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Phone"
                    fullWidth
                    size="small"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    sx={{ mb: 2 }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ textTransform: 'none' }}
                >
                    {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
