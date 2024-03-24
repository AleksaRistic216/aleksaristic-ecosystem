import { Card, CardActionArea, CardContent, CardMedia, Chip, Grid, Stack, Typography } from "@mui/material";
import { IProjectCardProps } from "../models/IProjectCardProps";
import PlaceholderImg from '../assets/placeholder.png'
export const ProjectCard = (props: IProjectCardProps): JSX.Element => {
    return (
        <Grid item sm={3}>
            <Card>
                <CardActionArea>
                    <CardMedia
                        sx={{
                            height: 140
                        }}
                        image={PlaceholderImg.src} />
                    <CardContent>
                        <Typography
                            sx={{
                                px: 0,
                                py: 2,
                                textAlign: `center`
                            }}>
                            { props.title ?? `Project Title` }
                        </Typography>

                        {
                            props.tags != null && props.tags.length > 0 ?
                                <Stack
                                    justifyContent={`center`}
                                    direction={`row`}
                                    useFlexGap
                                    flexWrap={`wrap`}
                                    spacing={1}
                                    sx={{
                                        my: 1,
                                        mb: 0,
                                    }}>
                                        {
                                            props.tags.map((tag, index) => {
                                                return (
                                                    <Chip key={index} label={tag} size={`small`} />
                                                )
                                            })
                                        }
                                </Stack> : null
                        }
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    )
}