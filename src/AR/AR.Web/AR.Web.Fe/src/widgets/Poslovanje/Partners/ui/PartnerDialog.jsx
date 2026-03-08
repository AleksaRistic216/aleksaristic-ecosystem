import { poslovanjService } from '@/app/services/poslovanjService'
import {
    Box,
    Button,
    Chip,
    Collapse,
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
import {
    Add,
    Close,
    Delete,
    ExpandLess,
    ExpandMore,
    Star,
    StarBorder,
} from '@mui/icons-material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const migrateBankAccounts = (partner) => {
    if (partner.bankAccounts && Array.isArray(partner.bankAccounts)) {
        return partner.bankAccounts
    }
    if (partner.bankAccount) {
        return [{ account: partner.bankAccount, primary: true }]
    }
    return []
}

export const PartnerDialog = ({ isOpen, onClose, partner }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const [name, setName] = useState('')
    const [taxId, setTaxId] = useState('')
    const [address, setAddress] = useState('')
    const [bankAccounts, setBankAccounts] = useState([])
    const [newAccount, setNewAccount] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [invoicePrefix, setInvoicePrefix] = useState('')
    const [representative, setRepresentative] = useState('')
    const [representativeTitle, setRepresentativeTitle] = useState('')
    const [bankName, setBankName] = useState('')
    const [bankAddress, setBankAddress] = useState('')
    const [swift, setSwift] = useState('')
    const [correspondentBank, setCorrespondentBank] = useState('')
    const [correspondentSwift, setCorrespondentSwift] = useState('')
    const [defaultCurrency, setDefaultCurrency] = useState('')
    const [templateId, setTemplateId] = useState('')
    const [showInvoiceSettings, setShowInvoiceSettings] = useState(false)
    const [templates, setTemplates] = useState([])

    const isEdit = !!partner

    useEffect(() => {
        if (!isOpen) return
        const unsub = poslovanjService.onTemplates(setTemplates)
        return () => unsub()
    }, [isOpen])

    useEffect(() => {
        if (partner) {
            setName(partner.name || '')
            setTaxId(partner.taxId || '')
            setAddress(partner.address || '')
            setBankAccounts(migrateBankAccounts(partner))
            setEmail(partner.email || '')
            setPhone(partner.phone || '')
            setNotes(partner.notes || '')
            setInvoicePrefix(partner.invoicePrefix || '')
            setRepresentative(partner.representative || '')
            setRepresentativeTitle(partner.representativeTitle || '')
            setBankName(partner.bankName || '')
            setBankAddress(partner.bankAddress || '')
            setSwift(partner.swift || '')
            setCorrespondentBank(partner.correspondentBank || '')
            setCorrespondentSwift(partner.correspondentSwift || '')
            setDefaultCurrency(partner.defaultCurrency || '')
            setTemplateId(partner.templateId || '')
            setShowInvoiceSettings(
                !!(
                    partner.invoicePrefix ||
                    partner.templateId ||
                    partner.representative ||
                    partner.bankName
                ),
            )
        } else {
            setName('')
            setTaxId('')
            setAddress('')
            setBankAccounts([])
            setEmail('')
            setPhone('')
            setNotes('')
            setInvoicePrefix('')
            setRepresentative('')
            setRepresentativeTitle('')
            setBankName('')
            setBankAddress('')
            setSwift('')
            setCorrespondentBank('')
            setCorrespondentSwift('')
            setDefaultCurrency('')
            setTemplateId('')
            setShowInvoiceSettings(false)
        }
        setNewAccount('')
    }, [partner, isOpen])

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
        setSaving(true)
        try {
            const data = {
                name: name.trim(),
                taxId: taxId.trim(),
                address: address.trim(),
                bankAccounts,
                email: email.trim(),
                phone: phone.trim(),
                notes: notes.trim(),
                invoicePrefix: invoicePrefix.trim(),
                representative: representative.trim(),
                representativeTitle: representativeTitle.trim(),
                bankName: bankName.trim(),
                bankAddress: bankAddress.trim(),
                swift: swift.trim(),
                correspondentBank: correspondentBank.trim(),
                correspondentSwift: correspondentSwift.trim(),
                defaultCurrency,
                templateId,
            }
            if (isEdit) {
                await poslovanjService.updatePartner(partner.key, data)
            } else {
                await poslovanjService.createPartner(data)
            }
            toast(isEdit ? 'Partner updated' : 'Partner created', {
                type: 'success',
            })
            onClose()
        } catch (error) {
            toast('Failed to save partner', { type: 'error' })
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
                {isEdit ? 'Edit Partner' : 'New Partner'}
                <IconButton onClick={onClose} size="small">
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <TextField
                    label="Name"
                    fullWidth
                    size="small"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={{ mb: 2, mt: 1 }}
                    autoFocus
                />
                <TextField
                    label="Tax ID"
                    fullWidth
                    size="small"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Address"
                    fullWidth
                    size="small"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    sx={{ mb: 2 }}
                />

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
                <TextField
                    label="Notes"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 1 }}
                />

                <Button
                    size="small"
                    onClick={() =>
                        setShowInvoiceSettings(!showInvoiceSettings)
                    }
                    endIcon={
                        showInvoiceSettings ? (
                            <ExpandLess />
                        ) : (
                            <ExpandMore />
                        )
                    }
                    sx={{ textTransform: 'none', mb: 1 }}
                >
                    Invoice Settings
                </Button>
                <Collapse in={showInvoiceSettings}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            pb: 1,
                        }}
                    >
                        <TextField
                            label="Invoice Prefix"
                            size="small"
                            fullWidth
                            value={invoicePrefix}
                            onChange={(e) =>
                                setInvoicePrefix(e.target.value)
                            }
                            placeholder="e.g. PIN-"
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Representative"
                                size="small"
                                fullWidth
                                value={representative}
                                onChange={(e) =>
                                    setRepresentative(e.target.value)
                                }
                            />
                            <TextField
                                label="Title"
                                size="small"
                                fullWidth
                                value={representativeTitle}
                                onChange={(e) =>
                                    setRepresentativeTitle(e.target.value)
                                }
                            />
                        </Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Bank Details (for invoices)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Bank Name"
                                size="small"
                                fullWidth
                                value={bankName}
                                onChange={(e) =>
                                    setBankName(e.target.value)
                                }
                            />
                            <TextField
                                label="SWIFT"
                                size="small"
                                fullWidth
                                value={swift}
                                onChange={(e) => setSwift(e.target.value)}
                            />
                        </Box>
                        <TextField
                            label="Bank Address"
                            size="small"
                            fullWidth
                            value={bankAddress}
                            onChange={(e) =>
                                setBankAddress(e.target.value)
                            }
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Correspondent Bank"
                                size="small"
                                fullWidth
                                value={correspondentBank}
                                onChange={(e) =>
                                    setCorrespondentBank(e.target.value)
                                }
                            />
                            <TextField
                                label="Correspondent SWIFT"
                                size="small"
                                fullWidth
                                value={correspondentSwift}
                                onChange={(e) =>
                                    setCorrespondentSwift(e.target.value)
                                }
                            />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Default Currency</InputLabel>
                                <Select
                                    value={defaultCurrency || ''}
                                    label="Default Currency"
                                    onChange={(e) =>
                                        setDefaultCurrency(e.target.value)
                                    }
                                >
                                    <MenuItem value="">None</MenuItem>
                                    <MenuItem value="EUR">EUR</MenuItem>
                                    <MenuItem value="USD">USD</MenuItem>
                                    <MenuItem value="RSD">RSD</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" fullWidth>
                                <InputLabel>Print Template</InputLabel>
                                <Select
                                    value={templateId || ''}
                                    label="Print Template"
                                    onChange={(e) =>
                                        setTemplateId(e.target.value)
                                    }
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {templates.map((t) => (
                                        <MenuItem
                                            key={t.key}
                                            value={t.key}
                                        >
                                            {t.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                </Collapse>
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
