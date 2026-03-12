import { Box, Grid, Link, Typography } from "@mui/material"
import { NavigationMenu } from "@/widgets/NavigationMenu"
import { Favorite } from "@mui/icons-material"
import { useRouter } from "next/router"

export const Layout = (props) => {
    const router = useRouter()
    const showFooter = router.pathname.startsWith('/investiranje')

    return (
        <Grid
            container
            direction={`column`}
            sx={{
                height: `100vh`,
                width: `100vw`,
                flexWrap: 'nowrap',
            }}>
                <NavigationMenu></NavigationMenu>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    {props.children}
                </Box>
                {showFooter && <Box
                    component="footer"
                    sx={{
                        py: 1.5,
                        px: 2,
                        textAlign: 'center',
                        borderTop: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Link
                        href="https://www.patreon.com/cw/AleksaRistic/membership"
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'text.secondary',
                            fontSize: '0.8rem',
                            '&:hover': { color: 'primary.main' },
                            transition: 'color 0.15s ease',
                        }}
                    >
                        <Favorite sx={{ fontSize: '0.9rem' }} />
                        Zahvali na Patreonu
                    </Link>
                </Box>}
        </Grid>
    )
}