import { Paper, styled } from '@mui/material'

export const PortfolioChartContainerStyled = styled(Paper)(
    ({ theme }) => `
        margin: 20px auto;
        max-width: 800px;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    `
)
