export interface IBlogPost {
    title: string
    date: string
    src: string
    text: string
    isPinned?: boolean
}

export interface IBlogWithKey {
    key: string
    data: IBlogPost
}

export interface IBlogEditorProps {
    isOpen: boolean
    onClose: () => void
    onSave: () => void
    initialData?: IBlogWithKey
    mode: 'create' | 'edit'
}
