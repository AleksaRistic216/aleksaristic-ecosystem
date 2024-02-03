import { Box, Grid, Paper, Typography, styled } from "@mui/material"
import { useEffect, useState } from "react"
import { ScrollDownHelper } from "../../ScrollDownHelper"

export const InfoCard = (): JSX.Element => {

    const maxOffsetTop = 20
    const [offsetTop, setOffsetTop] = useState<number>(maxOffsetTop)

    useEffect(() => {
        const iterations = 1000
        for (let i = 0; i < iterations; i++) {
            setTimeout(() => {
                setOffsetTop((prev) => prev <= 0 ? 0 : prev - (maxOffsetTop / iterations * i))
            }, 15 * i);
        }
    }, [])

    const ItemStyled = styled(Typography)(
        ({ theme }) => (`
            padding: ${theme.spacing(1)} ${theme.spacing(2)};
            font-weight: 600;

            label {
                color: rgba(30, 30, 30, 0.6);
                margin-right: ${theme.spacing(1)};
            }
        `
    ))

    return (
        <Grid
            item
            sm={12}
            style={{
                marginTop: `${offsetTop}vh`
            }}>
                <ScrollDownHelper></ScrollDownHelper>
                <Paper
                    sx={{
                        maxWidth: `600px`,
                        width: `80%`,
                        margin: `auto`,
                        py: 2,
                    }}>
                        <ItemStyled>
                            <label>Name:</label>
                            <span>Aleksa Ristić</span>
                        </ItemStyled>

                        <ItemStyled>
                            <label>Title:</label>
                            <span>Software Engineer</span>
                        </ItemStyled>

                        <ItemStyled>
                            <label>Current employer:</label>
                            <span>IT Labs</span>
                        </ItemStyled>

                        <ItemStyled>
                            <label>Position:</label>
                            <span>Back-end developer</span>
                        </ItemStyled>
                </Paper>
        </Grid>
    )
}