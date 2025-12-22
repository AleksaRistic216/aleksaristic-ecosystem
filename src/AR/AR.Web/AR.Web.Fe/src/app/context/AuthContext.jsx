import { firebaseAuth } from '@/app/firebase'
import { ADMIN_EMAIL } from '@/app/constants'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signIn = async (email, password) => {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
    }

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(firebaseAuth, provider)
    }

    const signOut = async () => {
        await firebaseSignOut(firebaseAuth)
    }

    const isAdmin = user?.email === ADMIN_EMAIL

    return (
        <AuthContext.Provider
            value={{ user, loading, isAdmin, signIn, signInWithGoogle, signOut }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
