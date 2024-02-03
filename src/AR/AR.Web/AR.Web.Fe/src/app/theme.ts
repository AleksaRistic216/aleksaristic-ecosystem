import { createTheme } from "@mui/material/styles"

declare module '@mui/material/styles' {
    interface Theme {
        dataBackground?: {
            primary: string,
            primaryHover: string,
            secondary: string,
            secondaryHover: string
        },
        defaultPagination: {
            options: number[],
            default: number
        }
    }

    interface ThemeOptions {
        dataBackground?: {
            primary: string,
            primaryHover: string,
            secondary: string,
            secondaryHover: string
        },
        defaultPagination?: {
            options: number[],
            default: number
        }
    }
}

export const mainTheme = createTheme({
    palette: {
        primary: {
            main: '#000',
            light: '#000',
            dark: '#000',
            contrastText: '#fff',
        },
        secondary: {
            main: '#000',
            light: '#000',
            dark: '#000',
            contrastText: '#fff',
        },
        error: {
            main: '#fff'
        },
        warning: {
            main: '#fff'
        },
        info: {
            main: '#fff'
        },
        success: {
            main: '#fff'
        }
    }
}, {
    dataBackground: {
        primary: '#ffffff',
        primaryHover: '#fffeee',
        secondary: '#eeeeee',
        secondaryHover: '#eeefff',
    },
    defaultPagination: {
        options: [10, 50, 100],
        default: 10
    }
})