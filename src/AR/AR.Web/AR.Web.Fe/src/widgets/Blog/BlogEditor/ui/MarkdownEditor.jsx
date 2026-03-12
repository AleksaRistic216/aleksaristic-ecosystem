import dynamic from 'next/dynamic'
import { CircularProgress, IconButton, Tooltip, Box } from '@mui/material'
import { Image as ImageIcon } from '@mui/icons-material'
import { useRef, useState } from 'react'
import { investiranjeService } from '@/app/services/investiranjeService'
import { toast } from 'react-toastify'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const LoadingFallback = () => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
        }}
    >
        <CircularProgress />
    </div>
)

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
    ssr: false,
    loading: LoadingFallback,
})

const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })

export const MarkdownEditor = ({ value, onChange }) => {
    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast('Molimo izaberite sliku', { type: 'warning' })
            return
        }

        setUploading(true)
        try {
            const base64 = await readFileAsBase64(file)
            const key = await investiranjeService.uploadImage(base64, file.name)
            const imageMarkdown = `![${file.name}](/api/investiranje-img/${key})`
            onChange(value ? `${value}\n${imageMarkdown}` : imageMarkdown)
            toast('Slika je otpremljena', { type: 'success' })
        } catch (error) {
            console.error(error)
            toast('Greška pri otpremanju slike', { type: 'error' })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    return (
        <div data-color-mode="light">
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                    gap: 1,
                }}
            >
                <Tooltip title="Dodaj sliku">
                    <span>
                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            size="small"
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                '&:hover': {
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                },
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {uploading ? (
                                <CircularProgress size={20} />
                            ) : (
                                <ImageIcon fontSize="small" />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
            />
            <MDEditor
                value={value}
                onChange={(val) => onChange(val || '')}
                height={400}
                preview="live"
            />
        </div>
    )
}
