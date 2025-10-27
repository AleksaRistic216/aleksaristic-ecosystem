import {
    Box,
    Grid,
    Paper,
    Typography,
    styled,
    CircularProgress,
    Button,
    Stack,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { ScrollDownHelper } from '../../ScrollDownHelper'
import { WhatsApp } from '@mui/icons-material'
import { ItemStyled } from '@/widgets/Explore/InfoCard/styled/ItemStyled'
import { TotalLines } from '@/widgets/Explore/InfoCard/ui/TotalLines'
import { GT, username } from '@/Constants'
import { toast } from 'react-toastify'

export const InfoCard = (): JSX.Element => {
    const maxOffsetTop = 20
    const [offsetTop, setOffsetTop] = useState<number>(maxOffsetTop)

    useEffect(() => {
        const iterations = 1000
        for (let i = 0; i < iterations; i++) {
            setTimeout(() => {
                setOffsetTop((prev) =>
                    prev <= 0 ? 0 : prev - (maxOffsetTop / iterations) * i
                )
            }, 15 * i)
        }
    }, [])

    const currentDate = new Date()
    const employedSince = new Date(2018, 1, 9)
    const codingSince = new Date(2014, 1, 9)
    const employedDiffYears = (
        (currentDate.getTime() - employedSince.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
    ).toFixed(2)
    const codingDiffYears = (
        (currentDate.getTime() - codingSince.getTime()) /
        (1000 * 60 * 60 * 24 * 365.25)
    ).toFixed(2)

    return (
        <Grid
            item
            sm={12}
            style={{
                marginTop: `${offsetTop}vh`,
            }}
        >
            <ScrollDownHelper></ScrollDownHelper>
            <Paper
                sx={{
                    maxWidth: `600px`,
                    width: `80%`,
                    margin: `auto`,
                    py: 2,
                }}
            >
                <ItemStyled>
                    <label>Name:</label>
                    <span>Aleksa Ristić</span>
                </ItemStyled>

                <ItemStyled>
                    <label>Title:</label>
                    <span>Software Engineer</span>
                </ItemStyled>

                {/*<ItemStyled>*/}
                {/*    <label>Current personal team size:</label>*/}
                {/*    <span>5</span>*/}
                {/*</ItemStyled>*/}

                <ItemStyled>
                    <label>Currently preferred stack:</label>
                    <span>.NET, react (Next.js), AWS, Azure</span>
                </ItemStyled>

                {/*<ItemStyled>*/}
                {/*    <label>Total contributions (live data):</label>*/}
                {/*    {totalContributions && (*/}
                {/*        <span>{totalContributions.toLocaleString()}</span>*/}
                {/*    )}*/}
                {/*    {!totalContributions && <CircularProgress size={`1em`} />}*/}
                {/*</ItemStyled>*/}

                {/*<TotalLines />*/}

                <ItemStyled>
                    <label>Contact email:</label>
                    <span>aristiccitsira@gmail.com</span>
                </ItemStyled>

                <ItemStyled>
                    <label>Contact phone:</label>
                    <span>
                        +381 69 369 1472{' '}
                        <WhatsApp sx={{ transform: `translate(5px, 5px)` }} />
                    </span>
                </ItemStyled>

                <ItemStyled>
                    <label>GitHub:</label>
                    <span>
                        <a
                            href={`https://github.com/AleksaRistic216`}
                            target={`_blank`}
                        >
                            github.com/{username}
                        </a>
                    </span>
                </ItemStyled>

                <ItemStyled>
                    <label>Current company:</label>
                    <span>
                        <a
                            href="https://devexpress.com"
                            target={`_blank
                        `}
                        >
                            DevExpress
                        </a>
                    </span>
                </ItemStyled>

                <ItemStyled>
                    <label>Technologies I work with:</label>
                    <span>
                        .NET Framework (v 3.5+), ASP.NET Core (v 2.1+), .NET (v
                        5+), React.js, Next.js, TypeScript, JavaScript,
                        Material-UI, Chakra-UI, SQL Server, PostgreSQL, Firebird
                        SQL, Entity Framework, Azure, AWS, Docker, Git,
                        Kubernetes, Microservices, MongoDB, GCP, Redis,
                        RabbitMQ, express.js, Node.js, Firebase, Bitbucket,
                        Github, TeamCity, Roslyn, Flutter
                    </span>
                </ItemStyled>

                <ItemStyled>
                    <label>Yrs Experience:</label>
                    <span>
                        Coding since 2014 ({codingDiffYears} yrs), under
                        contracts since 2018 ({employedDiffYears} yrs)
                    </span>
                </ItemStyled>

                <ItemStyled>
                    <Stack
                        direction={`row`}
                        spacing={2}
                        justifyContent={`center`}
                    >
                        <Button
                            variant={`contained`}
                            onClick={() => {
                                toast('Not implemented yet!', { type: 'info' })
                            }}
                        >
                            Print CV
                        </Button>
                    </Stack>
                </ItemStyled>
            </Paper>
        </Grid>
    )
}
