import { Card, Grid, LinearProgress, Typography } from "@mui/material"
import { ProjectCard } from "./ProjectCard"
import { get, getDatabase, ref, set } from "firebase/database"
import { firebaseApp } from "@/app/firebase"
import { useEffect, useState } from "react"

export const getServerSideProps = async () => {

    return {
        props: {
            title: "This application (aleksaristic.com)",
            tags: ["Next.js", "MUI", "Github Actions", "AWS EKS", "CI/CD", "Docker hub", "Linode LKE"]
        }
    }
}

export const ProjectsList = (): JSX.Element => {

    const [projects, setProjects] = useState<any[] | null>(null)

    useEffect(() => {
        const db = getDatabase(firebaseApp)
        console.log(db)

        get(ref(db, "/projects")).then((snapshot) => {
            if (snapshot.exists()) {
                setProjects(snapshot.val())
                console.log(snapshot.val())
            } else {
                console.log("No data available")
            }
        }).catch((error) => {
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
            justifyContent={`center`}>
                <Grid item sm={12}>
                    <Grid container justifyContent={`center`}>
                        <Grid item sm={6}>
                            <Typography
                                textAlign={`center`}
                                variant={`h6`}
                                p={4}>
                                Explore my open-sourced projects (the ones I can share publicly!) to explore my coding style and the technologies I use.
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item sm={12}>
                    <Grid container spacing={2}>
                        {
                            projects == null ?
                            <LinearProgress/> :
                                projects.map((project, index) => {
                                    return <ProjectCard
                                        key={index}
                                        title={project.title}
                                        tags={project.tags} />
                                })
                        }
                    </Grid>
                </Grid>
        </Grid>
    )
}