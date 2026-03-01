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

const db = getDatabase(firebaseApp)

export const personalBlogService = {
    async createPost(post) {
        const postsRef = ref(db, '/personal-blog')
        const newPostRef = push(postsRef)
        await set(newPostRef, post)
        return newPostRef.key
    },

    async updatePost(key, post) {
        const postRef = ref(db, `/personal-blog/${key}`)
        await update(postRef, post)
    },

    async deletePost(key) {
        const postRef = ref(db, `/personal-blog/${key}`)
        await remove(postRef)
    },

    async findPostKeyBySrc(src) {
        const q = query(ref(db, '/personal-blog'), orderByChild('src'), equalTo(src))
        const snapshot = await get(q)
        if (snapshot.exists()) {
            return Object.keys(snapshot.val())[0]
        }
        return null
    },

    async isSlugUnique(src, excludeKey) {
        const existingKey = await this.findPostKeyBySrc(src)
        if (!existingKey) return true
        return excludeKey === existingKey
    },
}
