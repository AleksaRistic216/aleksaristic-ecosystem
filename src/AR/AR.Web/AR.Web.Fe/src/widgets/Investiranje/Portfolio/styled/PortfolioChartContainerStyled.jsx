import { Paper, styled } from '@mui/material'

export const PortfolioChartContainerStyled = styled(Paper)(
    ({ theme }) => `
        margin: 20px auto;
        max-width: 800px;
        width: 100%;
        box-sizing: border-box;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        ${theme.breakpoints.up('sm')} {
            padding: 24px;
        }
    `
)
