import {
    Box,
    CircularProgress,
    Container,
    Fade,
    Grid,
    Typography,
} from '@mui/material'
import { ProjectCard } from './ProjectCard'
import { get, getDatabase, ref } from 'firebase/database'
import { firebaseApp } from '@/app/firebase'
import { useEffect, useState } from 'react'
import WorkIcon from '@mui/icons-material/Work'

export const ProjectsList = () => {
    const [projects, setProjects] = useState(null)

    useEffect(() => {
        const db = getDatabase(firebaseApp)

        get(ref(db, '/projects'))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setProjects(snapshot.val())
                } else {
                    console.log('No data available')
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }, [])

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#fafafa',
                py: { xs: 6, md: 10 },
            }}
        >
            <Container maxWidth="xl">
                <Box
                    sx={{
                        textAlign: 'center',
                        mb: { xs: 4, md: 6 },
                    }}
                >
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                        }}
                    >
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '12px',
                                backgroundColor: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                            }}
                        >
                            <WorkIcon sx={{ color: '#fff', fontSize: 24 }} />
                        </Box>
                        <Typography
                            variant="h4"
                            component="h1"
                            sx={{
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            My Projects
                        </Typography>
                    </Box>
                    <Typography
                        variant="body1"
                        sx={{
                            color: 'rgba(0,0,0,0.6)',
                            maxWidth: 600,
                            mx: 'auto',
                        }}
                    >
                        A collection of projects I&apos;ve worked on, from full-stack
                        applications to developer tools
                    </Typography>
                </Box>

                {projects == null ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 12,
                        }}
                    >
                        <CircularProgress
                            size={40}
                            thickness={4}
                            sx={{ color: '#000' }}
                        />
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 2,
                                color: 'rgba(0,0,0,0.5)',
                            }}
                        >
                            Loading projects...
                        </Typography>
                    </Box>
                ) : (
                    <Fade in={true} timeout={600}>
                        <Grid container spacing={3}>
                            {projects
                                .toSorted((x, y) => {
                                    return (
                                        (x.order === undefined
                                            ? 999999
                                            : parseInt(x.order)) -
                                        (y.order === undefined
                                            ? 999999
                                            : parseInt(y.order))
                                    )
                                })
                                .map((project, index) => {
                                    return (
                                        <ProjectCard
                                            description={project.description}
                                            key={index}
                                            github={project.github}
                                            mediaSrc={project.mediaSrc}
                                            title={project.title}
                                            tags={project.tags}
                                            images={project.images}
                                        />
                                    )
                                })}
                        </Grid>
                    </Fade>
                )}

                {projects && projects.length > 0 && (
                    <Box
                        sx={{
                            textAlign: 'center',
                            mt: 6,
                            pt: 4,
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{ color: 'rgba(0,0,0,0.5)' }}
                        >
                            {projects.length} projects • Click any card for
                            details
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    )
}
