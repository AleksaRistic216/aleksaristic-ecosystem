import { firebaseAuth } from '@/app/firebase'
import { ADMIN_EMAIL } from '@/app/constants'
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from 'react'

interface AuthContextType {
    user: User | null
    loading: boolean
    isAdmin: boolean
    signIn: (email: string, password: string) => Promise<void>
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            setUser(user)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signIn = async (email: string, password: string): Promise<void> => {
        await signInWithEmailAndPassword(firebaseAuth, email, password)
    }

    const signInWithGoogle = async (): Promise<void> => {
        const provider = new GoogleAuthProvider()
        await signInWithPopup(firebaseAuth, provider)
    }

    const signOut = async (): Promise<void> => {
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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
