import { poslovanjService } from '@/app/services/poslovanjService'
import {
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
    Button,
    useMediaQuery,
    useTheme,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export const EmployeeDialog = ({ isOpen, onClose, employee, partners = [] }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [name, setName] = useState('')
    const [position, setPosition] = useState('')
    const [partnerKey, setPartnerKey] = useState('')
    const [saving, setSaving] = useState(false)

    const isEdit = !!employee

    useEffect(() => {
        if (employee) {
            setName(employee.name || '')
            setPosition(employee.position || '')
            setPartnerKey(employee.partnerKey || '')
        } else {
            setName('')
            setPosition('')
            setPartnerKey('')
        }
    }, [employee, isOpen])

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
            const data = {
                name: name.trim(),
                position: position.trim(),
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
