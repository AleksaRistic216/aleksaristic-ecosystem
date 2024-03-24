import { firebaseApp } from "@/app/firebase"
import { Layout } from "@/widgets/Layout"
import { Grid } from "@mui/material"
import { equalTo, get, getDatabase, orderByChild, query, ref } from "firebase/database"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"

const BlogSrc = (): JSX.Element => {

    const router = useRouter()
    const src = router.query.src

    const [post, setPost] = useState<any | null>(null)

    useEffect(() => {
        if(src == undefined) {
            setPost(null)
            return
        }

        const db = getDatabase(firebaseApp)
        const q = query(ref(db, '/blogs'),
            orderByChild('src'),
            equalTo(src!.toString()))

        get(q).then((snapshot) => {
            if (snapshot.exists()) {
                console.log(snapshot.val())
                setPost(snapshot.val()[0])
            } else {
                console.log("No data available")
            }
        }).catch((error) => {
            console.error(error)
        })
        
    }, [src])

    return (
        <Layout>
            <Grid sx={{
                overflowY: `scroll`
            }}>
                {JSON.stringify(post)}
            </Grid>
        </Layout>
    )
}

export default BlogSrc