import { ItemStyled } from '../styled/ItemStyled'
import { useEffect, useState } from 'react'
import { GT, username } from '@/Constants'

export const TotalLines = () => {
    const [totalLines, setTotalLines] = useState(0)

    useEffect(() => {
        const fetchRepositories = async (username) => {
            const query = `
                query($login: String!) {
                    user(login: $login) {
                        repositories(first: 100, isFork: false) {
                            nodes {
                                name
                                owner {
                                    login
                                }
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
                body: JSON.stringify({ query, variables: { login: username } }),
            })

            const data = await response.json()
            return data?.data?.user?.repositories?.nodes || []
        }

        const processCommitDetails = async (response) => {
            if (response.ok) {
                const commitDetails = await response.json()
                if (commitDetails.stats) {
                    setTotalLines((prev) => prev + commitDetails.stats.total)
                }
            }
        }

        // Use REST API for commit analysis
        const fetchLinesChanged = async (owner, repo) => {
            let page = 1
            while (true) {
                const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100&page=${page++}`

                const response = await fetch(commitsUrl, {
                    headers: {
                        Authorization: `Bearer ${GT}`,
                    },
                })
                if (!response.ok) {
                    break
                }

                const commits = await response.json()

                for (const commit of commits) {
                    await fetch(
                        `https://api.github.com/repos/${owner}/${repo}/commits/${commit.sha}`,
                        {
                            headers: {
                                Authorization: `Bearer ${GT}`,
                            },
                        }
                    ).then((commitDetailsResponse) =>
                        processCommitDetails(commitDetailsResponse)
                    )
                }
            }
        }

        // Combine repositories and commits
        const analyzeContributions = async (username) => {
            const repos = await fetchRepositories(username)

            const fetchSegment = async (segment) => {
                const promises = []
                for (const repo of segment) {
                    promises.push(
                        fetchLinesChanged(repo.owner.login, repo.name)
                    )
                }
                await Promise.all(promises)
            }

            const segmentSize = 100
            const segments = Math.ceil(repos.length / segmentSize)
            for (var i = 0; i < segments; i++) {
                await fetchSegment(
                    repos.slice(i * segmentSize, (i + 1) * segmentSize)
                )
            }
        }

        analyzeContributions(username)
    }, [])
    return (
        <ItemStyled>
            <label>Total lines of code (live data):</label>
            <span>{totalLines.toLocaleString()}</span>
        </ItemStyled>
    )
}
