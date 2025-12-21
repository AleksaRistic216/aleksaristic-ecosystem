import { Button } from '@mui/material'
import NextLink from 'next/link'
import { GitHub, OpenInNew } from '@mui/icons-material'
import { IProjectsDetailsGithubProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsGithubProps'

export const ProjectsDetailsGithub = (props: IProjectsDetailsGithubProps) => {
    return (
        <Button
            LinkComponent={NextLink}
            href={props.github}
            target="_blank"
            startIcon={<GitHub />}
            endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
            variant="contained"
            sx={{
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1.25,
                fontSize: '0.95rem',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                '&:hover': {
                    backgroundColor: '#333',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                },
            }}
        >
            View on GitHub
        </Button>
    )
}
