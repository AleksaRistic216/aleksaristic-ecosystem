import { Grid, Paper, styled } from "@mui/material"
import { INotchProps } from "../models/INotchProps"

export const Notch = (props: INotchProps): JSX.Element => {

    const notchShadowBrightness = 0.5

    const NotchStyled = styled(Grid)(
        ({ theme }) => `
            padding: 20px 30px;

            &:hover {
                cursor: pointer;
            }
        `)

    const NotchInnerStyled = styled(Paper)(
        ({ theme }) => `
            background-color: white;
            padding: 5px 40px;
            box-shadow:
                0px 0px 5px 0px rgba(0,0,0,${notchShadowBrightness}),
                0px 0px 5px 0px rgba(0,0,0,${notchShadowBrightness})
        `)

    return (
        <NotchStyled>
            <NotchInnerStyled></NotchInnerStyled>
        </NotchStyled>
    )
}