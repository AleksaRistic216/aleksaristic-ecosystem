import { firebaseApp } from "@/app/firebase"
import { CircularProgress, Grid, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import { get, getDatabase, orderByChild, orderByValue, ref } from "firebase/database"
import { useEffect, useState } from "react"
import { BlogTableContainerStyled } from "../styled/BlogTableContainerStyled"
import { useRouter } from "next/router"

export const BlogTable = (): JSX.Element => {

    const router = useRouter()
    const [blogs, setBlogs] = useState<any[] | undefined>(undefined)

    useEffect(() => {
        const db = getDatabase(firebaseApp)

        get(ref(db, '/blogs')).then((snapshot) => {
            if (snapshot.exists()) {
                setBlogs(snapshot.val())
            } else {
                console.log("No data available")
            }
        }).catch((error) => {
            console.error(error)
        })

    }, [])
    
    return (
        blogs == undefined ?
            <CircularProgress /> :
            <Grid item sm={12}>
                <BlogTableContainerStyled component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell align="right">Date (yyyy/MM/dd)</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {blogs.sort((x: any, y: any) => (x.date > y.date ? -1 : 1)).map((blog: any) => (
                                <TableRow
                                    onClick={() => {
                                        router.push(`/blog/${blog.src}`)
                                    }}
                                    key={blog.title}
                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                >
                                    <TableCell component="th" scope="row">
                                        {blog.title}
                                    </TableCell>
                                    <TableCell align="right">{blog.date}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </BlogTableContainerStyled>
            </Grid>
    )
}