import {
    get,
    getDatabase,
    push,
    ref,
    remove,
    set,
    update,
    query,
    orderByChild,
    equalTo,
} from 'firebase/database'
import { firebaseApp } from '../firebase'
import { IBlogPost } from '@/widgets/Blog/BlogEditor/models/IBlogEditorProps'

const db = getDatabase(firebaseApp)

export const blogService = {
    async createBlog(blog: IBlogPost): Promise<string> {
        const blogsRef = ref(db, '/blogs')
        const newBlogRef = push(blogsRef)
        await set(newBlogRef, blog)
        return newBlogRef.key!
    },

    async updateBlog(key: string, blog: Partial<IBlogPost>): Promise<void> {
        const blogRef = ref(db, `/blogs/${key}`)
        await update(blogRef, blog)
    },

    async deleteBlog(key: string): Promise<void> {
        const blogRef = ref(db, `/blogs/${key}`)
        await remove(blogRef)
    },

    async findBlogKeyBySrc(src: string): Promise<string | null> {
        const q = query(ref(db, '/blogs'), orderByChild('src'), equalTo(src))
        const snapshot = await get(q)
        if (snapshot.exists()) {
            return Object.keys(snapshot.val())[0]
        }
        return null
    },

    async isSlugUnique(src: string, excludeKey?: string): Promise<boolean> {
        const existingKey = await this.findBlogKeyBySrc(src)
        if (!existingKey) return true
        return excludeKey === existingKey
    },
}
