import { Grid, LinearProgress, Typography } from '@mui/material'
import { ProjectCard } from './ProjectCard'
import { get, getDatabase, ref } from 'firebase/database'
import { firebaseApp } from '@/app/firebase'
import { useEffect, useState } from 'react'

export const ProjectsList = () => {
    const [projects, setProjects] = useState<any[] | null>(null)

    useEffect(() => {
        const db = getDatabase(firebaseApp)
        console.log(db)

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
        <Grid
            container
            spacing={2}
            maxWidth={`lg`}
            margin={`auto`}
            py={10}
            px={4}
            justifyContent={`center`}
        >
            <Grid item sm={12}>
                <Grid container justifyContent={`center`}>
                    <Grid item sm={6}>
                        <Typography textAlign={`center`} variant={`h6`} p={4}>
                            Feel free to explore my open-source projects (the ones I can share publicly!) 
                            to get a sense of my coding style and the technologies I work with.
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item sm={12}>
                <Grid container spacing={2}>
                    {projects == null ? (
                        <LinearProgress />
                    ) : (
                        projects
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
                                        key={index}
                                        mediaSrc={project.mediaSrc}
                                        title={project.title}
                                        tags={project.tags}
                                    />
                                )
                            })
                    )}
                </Grid>
            </Grid>
        </Grid>
    )
}
