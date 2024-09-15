import { Button, Typography } from '@mui/material'
import NextLink from 'next/link'
import { GitHub, OpenInNew } from '@mui/icons-material'
import { IProjectsDetailsGithubProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsGithubProps'

export const ProjectsDetailsGithub = (props: IProjectsDetailsGithubProps) => {
    return (
        <Button
            LinkComponent={NextLink}
            href={props.github}
            target={`_blank`}
            startIcon={<GitHub />}
            endIcon={<OpenInNew />}
            variant={`contained`}
        >
            <Typography>GitHub repository</Typography>
        </Button>
    )
}
