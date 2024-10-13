import { firebaseApp } from '@/app/firebase'
import {
    CircularProgress,
    Grid,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material'
import {
    get,
    getDatabase,
    orderByChild,
    orderByValue,
    query,
    ref,
} from 'firebase/database'
import { useEffect, useState } from 'react'
import { BlogTableContainerStyled } from '../styled/BlogTableContainerStyled'
import { useRouter } from 'next/router'
import { Pin, PinDrop, PushPin } from '@mui/icons-material'

export const BlogTable = (): JSX.Element => {
    const router = useRouter()
    const [blogs, setBlogs] = useState<any[] | undefined>(undefined)

    useEffect(() => {
        const db = getDatabase(firebaseApp)
        const q = query(ref(db, '/blogs'))

        get(q)
            .then((snapshot) => {
                if (snapshot.exists()) {
                    setBlogs(snapshot.val())
                } else {
                    console.log('No data available')
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }, [])

    return blogs == undefined ? (
        <CircularProgress />
    ) : (
        <Grid item sm={12}>
            <BlogTableContainerStyled component={Paper}>
                <Table aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell align="right">
                                Date (yyyy/MM/dd)
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {blogs
                            .filter((x: any) => x != null)
                            .toSorted((x: any, y: any) => {
                                if (x.isPinned !== y.isPinned)
                                    return y.isPinned - x.isPinned

                                return x.date > y.date ? -1 : 1
                            })
                            .map((blog: any) => (
                                <TableRow
                                    onClick={() => {
                                        router.push(`/blog/${blog.src}`)
                                    }}
                                    key={blog.title}
                                    sx={{
                                        '&:last-child td, &:last-child th': {
                                            border: 0,
                                        },
                                    }}
                                >
                                    <TableCell component="th" scope="row">
                                        {blog.isPinned != null &&
                                        blog.isPinned == true ? (
                                            <PushPin
                                                sx={{
                                                    fontSize: `1em`,
                                                    transform: `translateY(3px)`,
                                                    marginRight: 1,
                                                }}
                                            />
                                        ) : null}
                                        {blog.title}
                                    </TableCell>
                                    <TableCell align="right">
                                        {blog.date}
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </BlogTableContainerStyled>
        </Grid>
    )
}
