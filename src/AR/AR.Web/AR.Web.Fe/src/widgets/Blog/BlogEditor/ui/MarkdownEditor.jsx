import dynamic from 'next/dynamic'
import { CircularProgress } from '@mui/material'
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

export const MarkdownEditor = ({ value, onChange }) => {
    return (
        <div data-color-mode="light">
            <MDEditor
                value={value}
                onChange={(val) => onChange(val || '')}
                height={400}
                preview="live"
            />
        </div>
    )
}
