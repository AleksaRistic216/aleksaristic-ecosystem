import { Box, ImageList, ImageListItem, Typography } from '@mui/material'
import { IProjectsDetailsGalleryProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsGalleryProps'
import {
    PROJECTS_DETAILS_GALLERY_DEFAULT_ROWS,
    PROJECTS_DETAILS_GALLERY_MAX_COLUMNS,
    PROJECTS_DETAILS_GALLERY_ROW_HEIGHT,
} from '@/widgets/Projects/ProjectsList/constants'
import CollectionsIcon from '@mui/icons-material/Collections'

export const ProjectsDetailsGallery = (props: IProjectsDetailsGalleryProps) => {
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
                <CollectionsIcon
                    sx={{ fontSize: 20, color: 'rgba(0,0,0,0.6)' }}
                />
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        fontSize: '1.1rem',
                    }}
                >
                    Gallery
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'rgba(0,0,0,0.5)',
                        ml: 1,
                    }}
                >
                    {props.images.length} image
                    {props.images.length !== 1 ? 's' : ''}
                </Typography>
            </Box>
            <ImageList
                variant="quilted"
                cols={PROJECTS_DETAILS_GALLERY_MAX_COLUMNS}
                rowHeight={PROJECTS_DETAILS_GALLERY_ROW_HEIGHT}
                gap={16}
                sx={{
                    m: 0,
                    borderRadius: 2,
                    overflow: 'hidden',
                }}
            >
                {props.images.map((image: any, i) => (
                    <ImageListItem
                        key={i}
                        rows={PROJECTS_DETAILS_GALLERY_DEFAULT_ROWS}
                        cols={1}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.08)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                transform: 'scale(1.02)',
                            },
                        }}
                    >
                        <img
                            src={image.src}
                            loading="lazy"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </ImageListItem>
                ))}
            </ImageList>
        </Box>
    )
}
