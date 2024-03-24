import { Grid, styled } from "@mui/material"
import { Item } from "./Item"
import { Book, DarkMode, Explore, GitHub, LightMode } from "@mui/icons-material"
import { toast } from "react-toastify"
import { IItemsWrapperProps } from "../models/IItemsWrapperProps"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"

export const ItemsWrapper = (props: IItemsWrapperProps): JSX.Element => {

    const router = useRouter()
    const [marginTop, setMarginTop] = useState(-100)

    const ItemsWrapperStyled = styled(Grid)(
        ({ theme }) => `
            position: relative;
            margin-top: ${marginTop}%;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 10px;
        `)

    props.innerRef.current = {
        show: () => {
            if(marginTop < 0)
            {
                setMarginTop((prev) => prev + 1)
                const speed = 1
                for(var i = 0; i < 100 * speed; i++)
                {
                    setTimeout(() => {
                        setMarginTop((prev) => prev + (1 / speed))
                    }, i)
                }
            }
        }
    }

    return (
        <ItemsWrapperStyled
            container
            justifyContent={`center`}>
            <Item
                icon={<Explore />}
                text={`Explore`}
                onClick={() => {
                    router.push(`/explore`)
                }}>
            </Item>
            <Item
                icon={<GitHub />}
                text={`My projects`}
                onClick={() => {
                    router.push(`/projects`)
                }}>
            </Item>
            <Item
                icon={<Book />}
                text={`Blog`}
                onClick={() => {
                    router.push(`/blog`)
                }}>
            </Item>
            <Item
                icon={<DarkMode />}
                text={`Dark mode`}
                onClick={() => {
                    toast.warning(`Dark mode is not available yet`)
                }}>
            </Item>
            <Item
                icon={<LightMode />}
                text={`Light mode`}
                onClick={() => {
                    toast.warning(`Light mode is not available yet`)
                }}>
            </Item>
        </ItemsWrapperStyled>
    )
}