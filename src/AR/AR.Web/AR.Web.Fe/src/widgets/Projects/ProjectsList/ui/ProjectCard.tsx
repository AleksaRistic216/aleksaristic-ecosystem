import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Chip,
    Grid,
    Stack,
    Typography,
} from '@mui/material'
import { IProjectCardProps } from '../models/IProjectCardProps'
import PlaceholderImg from '../assets/placeholder.png'
import { ProjectsDetails } from '@/widgets/Projects/ProjectsList/ui/ProjectsDetails'
import { useState } from 'react'
export const ProjectCard = (props: IProjectCardProps) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    return (
        <Grid item sm={3}>
            {((props.images && props.images.length > 0) ||
                props.description ||
                props.github) && (
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
            >
                <CardActionArea>
                    <CardMedia
                        sx={{
                            height: 140,
                        }}
                        image={props.mediaSrc ?? PlaceholderImg.src}
                    />
                    <CardContent>
                        <Typography
                            sx={{
                                px: 0,
                                py: 2,
                                textAlign: `center`,
                            }}
                        >
                            {props.title ?? `Project Title`}
                        </Typography>

                        {props.tags != null && props.tags.length > 0 ? (
                            <Stack
                                justifyContent={`center`}
                                direction={`row`}
                                useFlexGap
                                flexWrap={`wrap`}
                                spacing={1}
                                sx={{
                                    my: 1,
                                    mb: 0,
                                }}
                            >
                                {props.tags.map((tag, index) => {
                                    return (
                                        <Chip
                                            key={index}
                                            label={tag}
                                            size={`small`}
                                        />
                                    )
                                })}
                            </Stack>
                        ) : null}
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    )
}
