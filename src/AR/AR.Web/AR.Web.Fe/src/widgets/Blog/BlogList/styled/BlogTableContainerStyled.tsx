import { TableContainer, styled } from "@mui/material";

export const BlogTableContainerStyled = styled(TableContainer)<{ component: any }>
(
    ({ theme }) => `

        margin: 20px auto;
        max-width: 800px;

        tbody > tr:hover {
            cursor: pointer;
            background-color: ${theme.palette.action.hover};
        }
    `
)