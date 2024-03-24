import { Box, Grid, Paper, Typography, styled } from "@mui/material"
import { useEffect, useState } from "react"
import { ScrollDownHelper } from "../../ScrollDownHelper"
import { WhatsApp } from "@mui/icons-material"

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

    const currentDate = new Date()
    const emplyedFor = new Date(2023, 1, 9)
    const diff = Math.floor((currentDate.valueOf() - emplyedFor.valueOf()) / 1000 / 60 / 60 / 24)
    const diffYears = Math.floor(diff / 365)
    const diffMonths = Math.floor((diff - (diffYears * 365)) / 30.5)

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
                            <label>Current position:</label>
                            <span>Back-end developer</span>
                        </ItemStyled>

                        <ItemStyled>
                            <label>Since last job change:</label>
                            <span>{diffYears} years & {diffMonths} months</span>
                        </ItemStyled>

                        <ItemStyled>
                            <label>Contact email:</label>
                            <span>aristiccitsira@gmail.com</span>
                        </ItemStyled>

                        <ItemStyled>
                            <label>Contact phone:</label>
                            <span>+381 69 369 1472 <WhatsApp /></span>
                        </ItemStyled>
                </Paper>
        </Grid>
    )
}