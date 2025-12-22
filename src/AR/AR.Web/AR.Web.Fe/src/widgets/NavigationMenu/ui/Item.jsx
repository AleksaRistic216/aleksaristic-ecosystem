import { Grid, Typography, styled } from "@mui/material"

export const Item = (props) => {
    const ItemStyled = styled(Grid)(
        ({ theme }) => `
            padding: 15px;
            transition-duration: 0.3s;
    
            &:hover {
                cursor: pointer;
                color: red;
                -webkit-user-select: none; /* Safari */
                -ms-user-select: none; /* IE 10 and IE 11 */
                user-select: none; /* Standard syntax */
            }
        `)

    return (
        <ItemStyled
            item
            onClick={() => {
                props.onClick()
            }}>
            {props.icon}
            <Typography>
                {props.text}
            </Typography>
        </ItemStyled>
    )
}