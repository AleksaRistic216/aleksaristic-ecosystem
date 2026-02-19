import { mainTheme } from '@/app/theme'
import { Stack, ThemeProvider, Typography } from '@mui/material'
import { ToastContainer } from 'react-toastify'
import './../app/globals.css'
import 'react-toastify/dist/ReactToastify.css'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { useRouter } from 'next/router'
import { PostHogProvider } from 'posthog-js/react'
import { AuthProvider } from '@/app/context/AuthContext'

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
            process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        // Enable debug mode in development
        loaded: (posthog) => {
            if (process.env.NODE_ENV === 'development') posthog.debug()
        },
    })
}

export default function MyApp({ Component, pageProps }) {
    const router = useRouter()

    useEffect(() => {
        // Track page views
        const handleRouteChange = () => posthog?.capture('$pageview')
        router.events.on('routeChangeComplete', handleRouteChange)

        return () => {
            router.events.off('routeChangeComplete', handleRouteChange)
        }
    }, [])

    const isInvestiranje = router.pathname.startsWith('/investiranje')

    return (
        <PostHogProvider client={posthog}>
            <ThemeProvider theme={mainTheme}>
                <AuthProvider>
                    {!isInvestiranje && (
                        <Stack
                            alignItems={`center`}
                            justifyContent={`center`}
                            sx={{
                                height: `100vh`,
                                display: {
                                    xs: 'grid',
                                    lg: 'none',
                                },
                            }}
                        >
                            <Typography>
                                This website is accessible only on PC
                            </Typography>
                        </Stack>
                    )}
                    <Stack
                        sx={{
                            display: isInvestiranje
                                ? 'grid'
                                : { xs: 'none', lg: 'grid' },
                        }}
                    >
                        <ToastContainer position={`top-right`} />
                        <Component {...pageProps} />
                    </Stack>
                </AuthProvider>
            </ThemeProvider>
        </PostHogProvider>
    )
}
