import { Box, Typography } from '@mui/material'
import { IProjectsDetailsDescriptionProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsDescriptionProps'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export const ProjectsDetailsDescription = (
    props: IProjectsDetailsDescriptionProps
) => {
    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                }}
            >
                <InfoOutlinedIcon
                    sx={{ fontSize: 20, color: 'rgba(0,0,0,0.6)' }}
                />
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                    }}
                >
                    About this project
                </Typography>
            </Box>
            <Box
                sx={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: 2,
                    p: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                {props.description.includes('<') ? (
                    <Typography
                        sx={{
                            color: 'rgba(0,0,0,0.8)',
                            lineHeight: 1.7,
                            '& p': { mb: 1.5 },
                            '& a': { color: '#000', fontWeight: 500 },
                        }}
                        dangerouslySetInnerHTML={{ __html: props.description }}
                    />
                ) : (
                    <Typography
                        sx={{
                            color: 'rgba(0,0,0,0.8)',
                            lineHeight: 1.7,
                        }}
                    >
                        {props.description}
                    </Typography>
                )}
            </Box>
        </Box>
    )
}
