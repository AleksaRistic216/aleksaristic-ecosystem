import { Grid, styled } from "@mui/material"
import { IItemProps } from "../models/IItemProps"

export const Item = (props: IItemProps): JSX.Element => {
    const ItemStyled = styled(Grid)(
        ({ theme }) => `
            padding: 15px;
            transition-duration: 0.3s;
    
            &:hover {
                cursor: pointer;
                color: red;
            }
        `)

    return (
        <ItemStyled
            item
            onClick={() => {
                props.onClick()
            }}>
            {props.icon}
        </ItemStyled>
    )
}