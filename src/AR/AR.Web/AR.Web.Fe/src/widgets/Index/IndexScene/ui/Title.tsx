import { Typography } from "@mui/material";
import { forwardRef, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const Title = (props: any): JSX.Element => {

    const [opacity, setOpacity] = useState<number>(0)

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