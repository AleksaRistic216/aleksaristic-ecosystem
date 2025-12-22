import {
    Box,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Grid,
    Stack,
    Typography,
} from '@mui/material'
import PlaceholderImg from '../assets/placeholder.png'
import { ProjectsDetails } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetails'
import { useState } from 'react'
import CollectionsIcon from '@mui/icons-material/Collections'
import GitHubIcon from '@mui/icons-material/GitHub'
import DescriptionIcon from '@mui/icons-material/Description'

export const ProjectCard = (props) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const hasDetails =
        (props.images && props.images.length > 0) ||
        props.description ||
        props.github

    return (
        <Grid item xs={12} sm={6} md={4} lg={3}>
            {hasDetails && (
                <ProjectsDetails
                    description={props.description}
                    images={props.images}
                    github={props.github}
                    isOpen={isDetailsOpen}
                    onClose={() => {
                        setIsDetailsOpen(false)
                    }}
                />
            )}
            <Card
                onClick={() => {
                    setIsDetailsOpen(true)
                }}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'rgba(0, 0, 0, 0.08)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
                        borderColor: 'rgba(0, 0, 0, 0.12)',
                    },
                }}
            >
                <CardActionArea
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'stretch',
                    }}
                >
                    <Box
                        sx={{
                            position: 'relative',
                            paddingTop: '56.25%',
                            overflow: 'hidden',
                            backgroundColor: '#f5f5f5',
                        }}
                    >
                        <Box
                            component="img"
                            src={props.mediaSrc ?? PlaceholderImg.src}
                            alt={props.title ?? 'Project'}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.4s ease',
                                '.MuiCard-root:hover &': {
                                    transform: 'scale(1.05)',
                                },
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background:
                                    'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 100%)',
                                pointerEvents: 'none',
                            }}
                        />
                        {hasDetails && (
                            <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                }}
                            >
                                {props.github && (
                                    <Box
                                        sx={{
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            borderRadius: '50%',
                                            p: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <GitHubIcon
                                            sx={{
                                                fontSize: 16,
                                                color: 'white',
                                            }}
                                        />
                                    </Box>
                                )}
                                {props.description && (
                                    <Box
                                        sx={{
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            borderRadius: '50%',
                                            p: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <DescriptionIcon
                                            sx={{
                                                fontSize: 16,
                                                color: 'white',
                                            }}
                                        />
                                    </Box>
                                )}
                                {props.images && props.images.length > 0 && (
                                    <Box
                                        sx={{
                                            backgroundColor: 'rgba(0,0,0,0.6)',
                                            borderRadius: '50%',
                                            p: 0.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <CollectionsIcon
                                            sx={{
                                                fontSize: 16,
                                                color: 'white',
                                            }}
                                        />
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>
                    <CardContent
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            p: 2.5,
                            '&:last-child': { pb: 2.5 },
                        }}
                    >
                        <Typography
                            variant="subtitle1"
                            component="h3"
                            sx={{
                                fontWeight: 600,
                                textAlign: 'center',
                                mb: 2,
                                lineHeight: 1.3,
                                minHeight: '2.6em',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                        >
                            {props.title ?? 'Project Title'}
                        </Typography>

                        {props.tags != null && props.tags.length > 0 && (
                            <Stack
                                justifyContent="center"
                                direction="row"
                                useFlexGap
                                flexWrap="wrap"
                                spacing={0.75}
                                sx={{ mt: 'auto' }}
                            >
                                {props.tags.slice(0, 5).map((tag, index) => (
                                    <Chip
                                        key={index}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            fontSize: '0.7rem',
                                            height: 24,
                                            borderColor: 'rgba(0,0,0,0.2)',
                                            color: 'rgba(0,0,0,0.7)',
                                            '&:hover': {
                                                backgroundColor:
                                                    'rgba(0,0,0,0.04)',
                                            },
                                        }}
                                    />
                                ))}
                                {props.tags.length > 5 && (
                                    <Chip
                                        label={`+${props.tags.length - 5}`}
                                        size="small"
                                        sx={{
                                            fontSize: '0.7rem',
                                            height: 24,
                                            backgroundColor: 'rgba(0,0,0,0.08)',
                                            color: 'rgba(0,0,0,0.6)',
                                        }}
                                    />
                                )}
                            </Stack>
                        )}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    )
}
