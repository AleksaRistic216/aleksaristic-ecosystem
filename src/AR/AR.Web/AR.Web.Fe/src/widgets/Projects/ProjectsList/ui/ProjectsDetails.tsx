import {
    Box,
    Dialog,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Slide,
} from '@mui/material'
import { ProjectsDetailsGallery } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetailsGallery'
import { IProjectsDetailsProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsProps'
import { ProjectsDetailsGithub } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetailsGithub'
import { ProjectsDetailsDescription } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetailsDescription'
import CloseIcon from '@mui/icons-material/Close'
import { TransitionProps } from '@mui/material/transitions'
import { forwardRef } from 'react'

const Transition = forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />
})

export const ProjectsDetails = (props: IProjectsDetailsProps) => {
    return (
        <Dialog
            open={props.isOpen}
            onClose={() => {
                props.onClose()
            }}
            fullWidth={true}
            maxWidth="lg"
            scroll="paper"
            TransitionComponent={Transition}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle
                sx={{
                    p: 1,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
            >
                <IconButton
                    onClick={() => props.onClose()}
                    sx={{
                        color: 'rgba(0,0,0,0.6)',
                        '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.08)',
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
                {props.github && (
                    <Box sx={{ mb: 3 }}>
                        <ProjectsDetailsGithub github={props.github} />
                    </Box>
                )}
                {props.description && (
                    <>
                        <ProjectsDetailsDescription
                            description={props.description}
                        />
                        {props.images && props.images.length > 0 && (
                            <Divider sx={{ my: 3 }} />
                        )}
                    </>
                )}
                {props.images && props.images.length > 0 && (
                    <ProjectsDetailsGallery images={props.images!} />
                )}
            </DialogContent>
        </Dialog>
    )
}
