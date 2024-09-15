import { Dialog, Grid } from '@mui/material'
import { ProjectsDetailsGallery } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetailsGallery'
import { IProjectsDetailsProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsProps'
import { ProjectsDetailsGithub } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetailsGithub'
import { ProjectsDetailsDescription } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetailsDescription'

export const ProjectsDetails = (props: IProjectsDetailsProps) => {
    return (
        <Dialog
            open={props.isOpen}
            onClose={() => {
                props.onClose()
            }}
            fullWidth={true}
            maxWidth={`lg`}
        >
            <Grid container p={2}>
                {props.github && (
                    <ProjectsDetailsGithub github={props.github} />
                )}
                {props.description && (
                    <ProjectsDetailsDescription
                        description={props.description}
                    />
                )}
                {props.images && (
                    <ProjectsDetailsGallery images={props.images!} />
                )}
            </Grid>
        </Dialog>
    )
}
