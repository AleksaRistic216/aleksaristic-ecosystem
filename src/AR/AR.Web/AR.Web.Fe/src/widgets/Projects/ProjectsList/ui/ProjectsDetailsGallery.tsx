import {
    Button,
    Grid,
    ImageList,
    ImageListItem,
    Typography,
} from '@mui/material'
import { IProjectsDetailsGalleryProps } from '@/widgets/Projects/ProjectsList/models/IProjectsDetailsGalleryProps'
import {
    PROJECTS_DETAILS_GALLERY_DEFAULT_ROWS,
    PROJECTS_DETAILS_GALLERY_MAX_COLUMNS,
    PROJECTS_DETAILS_GALLERY_ROW_HEIGHT,
} from '@/widgets/Projects/ProjectsList/constants'

export const ProjectsDetailsGallery = (props: IProjectsDetailsGalleryProps) => {
    return (
        <Grid item sm={12}>
            <ImageList
                variant="quilted"
                cols={PROJECTS_DETAILS_GALLERY_MAX_COLUMNS}
                rowHeight={PROJECTS_DETAILS_GALLERY_ROW_HEIGHT}
                sx={{
                    alignItems: 'center',
                }}
            >
                {props.images.map((image: any, i) => (
                    <ImageListItem
                        key={i}
                        rows={PROJECTS_DETAILS_GALLERY_DEFAULT_ROWS}
                        cols={1}
                        sx={{
                            m: 2,
                            border: 1,
                            borderColor: 'divider',
                            boxShadow: 5,
                        }}
                    >
                        <img src={image.src} loading="lazy" />
                    </ImageListItem>
                ))}
            </ImageList>
        </Grid>
    )
}
