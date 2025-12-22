import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

export const Title = (props) => {

    const [opacity, setOpacity] = useState(0)

    useEffect(() => {
        setTimeout(() => {
            for(var i = 0; i < 1000; i++)
                setTimeout(() => {
                    setOpacity((prev) => prev + 0.001)
                }, i);
        }, 1800);
    }, [])

    props.innerRef.current = {
        hideTitle: () => {
            for(var i = 0; i < 1000; i++)
                setTimeout(() => {
                    setOpacity((prev) => prev - 0.001)
                }, i);
        }
    }
    return (
        <Typography
            variant={`h4`}
            sx={{
                opacity: opacity,
            }}
            component={`h1`}>
                Aleksa Ristić
        </Typography>
    )
}