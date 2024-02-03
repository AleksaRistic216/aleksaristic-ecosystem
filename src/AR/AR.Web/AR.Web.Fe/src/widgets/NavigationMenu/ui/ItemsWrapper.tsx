import { Grid, styled } from "@mui/material"
import { Item } from "./Item"
import { DarkMode, LightMode } from "@mui/icons-material"
import { toast } from "react-toastify"
import { IItemsWrapperProps } from "../models/IItemsWrapperProps"
import { useState } from "react"

export const ItemsWrapper = (props: IItemsWrapperProps): JSX.Element => {

    const [marginTop, setMarginTop] = useState(-100)

    const ItemsWrapperStyled = styled(Grid)(
        ({ theme }) => `
            margin-top: ${marginTop}px;
        `)

    props.innerRef.current = {
        show: () => {
            if(marginTop < 0)
            {
                setMarginTop((prev) => prev + 1)
                for(var i = 0; i < 100; i++)
                    setTimeout(() => {
                        setMarginTop((prev) => prev + 1)
                    }, i * 2)
            }
        }
    }

    return (
        <ItemsWrapperStyled
            container
            justifyContent={`center`}>
            <Item
                icon={<span>{props.isShown.toString()}</span>}
                onClick={() => {
                    toast.warning(`Dark mode is not available yet`)
                }}>
            </Item>
            <Item
                icon={<DarkMode />}
                onClick={() => {
                    toast.warning(`Dark mode is not available yet`)
                }}>
            </Item>
            <Item
                icon={<LightMode />}
                onClick={() => {
                    toast.warning(`Light mode is not available yet`)
                }}>
            </Item>
        </ItemsWrapperStyled>
    )
}