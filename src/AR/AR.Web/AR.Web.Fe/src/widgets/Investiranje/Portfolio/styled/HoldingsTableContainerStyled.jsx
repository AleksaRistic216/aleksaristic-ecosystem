import { TableContainer, styled } from '@mui/material'

export const HoldingsTableContainerStyled = styled(TableContainer)(
    ({ theme }) => `
        margin: 20px auto;
        max-width: 800px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        overflow-x: auto;

        thead {
            background-color: ${theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[50]};
        }

        thead th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            color: ${theme.palette.text.secondary};
            padding: 12px 12px;
            border-bottom: 2px solid ${theme.palette.divider};
            white-space: nowrap;
        }

        thead th:first-of-type,
        tbody td:first-of-type,
        tbody th:first-of-type {
            padding-left: 24px;
        }

        thead th:last-of-type,
        tbody td:last-of-type,
        tbody th:last-of-type {
            padding-right: 24px;
        }

        tbody td, tbody th {
            padding: 12px 12px;
            transition: background-color 0.15s ease;
        }

        tbody > tr:not(:last-child) td,
        tbody > tr:not(:last-child) th {
            border-bottom: 1px solid ${theme.palette.divider};
        }
    `
)
