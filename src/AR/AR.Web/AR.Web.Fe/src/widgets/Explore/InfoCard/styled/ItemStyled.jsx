import { styled, Typography } from '@mui/material'

export const ItemStyled = styled(Typography)(
    ({ theme }) => `
            padding: ${theme.spacing(1)} ${theme.spacing(2)};
            font-weight: 600;

            label {
                color: rgba(30, 30, 30, 0.6);
                margin-right: ${theme.spacing(1)};
            }
        `
)
