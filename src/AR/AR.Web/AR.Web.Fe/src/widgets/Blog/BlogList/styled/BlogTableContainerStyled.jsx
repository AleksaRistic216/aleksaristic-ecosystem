import { TableContainer, styled } from '@mui/material'

export const BlogTableContainerStyled = styled(TableContainer)(
    ({ theme }) => `
        margin: 20px auto;
        max-width: 800px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        overflow: hidden;

        thead {
            background-color: ${theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50]};
        }

        thead th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            color: ${theme.palette.text.secondary};
            padding: 16px 24px;
            border-bottom: 2px solid ${theme.palette.divider};
        }

        tbody td, tbody th {
            padding: 16px 24px;
            transition: background-color 0.15s ease;
        }

        tbody > tr {
            cursor: pointer;
            transition: all 0.15s ease;
        }

        tbody > tr:hover {
            background-color: ${theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.primary.main + '08'};
            transform: translateX(4px);
        }

        tbody > tr:hover th {
            color: ${theme.palette.primary.main};
        }

        tbody > tr:not(:last-child) td,
        tbody > tr:not(:last-child) th {
            border-bottom: 1px solid ${theme.palette.divider};
        }
    `
)