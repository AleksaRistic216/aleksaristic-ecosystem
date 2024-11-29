import {
    Box,
    Grid,
    Paper,
    Typography,
    styled,
    CircularProgress,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { ScrollDownHelper } from '../../ScrollDownHelper'
import { WhatsApp } from '@mui/icons-material'
import { ItemStyled } from '@/widgets/Explore/InfoCard/styled/ItemStyled'
import { TotalLines } from '@/widgets/Explore/InfoCard/ui/TotalLines'
import { GT, username } from '@/Constants'

export const InfoCard = (): JSX.Element => {
    const maxOffsetTop = 20
    const [offsetTop, setOffsetTop] = useState<number>(maxOffsetTop)
    const [totalContributions, setTotalContributions] = useState<
        number | undefined
    >(undefined)

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

    useEffect(() => {
        const query = `
        query($login: String!) {
            user(login: $login) {
                contributionsCollection {
                    contributionCalendar {
                        totalContributions
                    }
                }
            }
        }`

        const fetchContributions = async (
            username: any,
            startDate: any,
            endDate: any
        ) => {
            const query = `
        query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
                contributionsCollection(from: $from, to: $to) {
                    contributionCalendar {
                        totalContributions
                    }
                }
            }
        }`

            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${GT}`,
                },
                body: JSON.stringify({
                    query,
                    variables: {
                        login: username,
                        from: startDate,
                        to: endDate,
                    },
                }),
            })

            const data = await response.json()
            return (
                data?.data?.user?.contributionsCollection?.contributionCalendar
                    ?.totalContributions || 0
            )
        }

        // Loop over years
        const getAllContributions = async (username: any) => {
            let totalContributions = 0
            const currentYear = new Date().getFullYear()

            for (let year = currentYear - 40; year <= currentYear; year++) {
                const startDate = `${year}-01-01T00:00:00Z`
                const endDate = `${year}-12-31T23:59:59Z`
                totalContributions += await fetchContributions(
                    username,
                    startDate,
                    endDate
                )
            }

            setTotalContributions(totalContributions)
        }

        getAllContributions(username)
    }, [])

    const currentDate = new Date()
    const emplyedFor = new Date(2023, 1, 9)
    const diff = Math.floor(
        (currentDate.valueOf() - emplyedFor.valueOf()) / 1000 / 60 / 60 / 24
    )
    const diffYears = Math.floor(diff / 365)
    const diffMonths = Math.floor((diff - diffYears * 365) / 30.5)

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

                <ItemStyled>
                    <label>Current personal team size:</label>
                    <span>5</span>
                </ItemStyled>

                <ItemStyled>
                    <label>Currently preferred stack:</label>
                    <span>AWS, dotnet, Next.js</span>
                </ItemStyled>

                <ItemStyled>
                    <label>Total contributions (live data):</label>
                    {totalContributions && (
                        <span>{totalContributions.toLocaleString()}</span>
                    )}
                    {!totalContributions && <CircularProgress size={`1em`} />}
                </ItemStyled>

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
            </Paper>
        </Grid>
    )
}
