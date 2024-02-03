import { Grid, styled } from "@mui/material"
import { IWrapperProps } from "../models/IWrapperProps"

export const Wrapper = (props: IWrapperProps): JSX.Element => {

    const WrapperStyled = styled(Grid)(
        ({ theme }) => `
            position: absolute;
            text-align: center;
            justify-content: center;
            width: auto;
            margin: auto;
            left: 50vw;
            transform: translateX(-50%);
            z-index: 100;
        `)

    return (
        <WrapperStyled
            container
            onMouseEnter={() => {
                if(props.onMouseEnter != null && props.onMouseEnter != undefined)
                    props.onMouseEnter()
            }}
            onMouseLeave={() => {
                if(props.onMouseLeave != null && props.onMouseLeave != undefined)
                    props.onMouseLeave()
            }}>
                {props.children}
        </WrapperStyled>
    )
}