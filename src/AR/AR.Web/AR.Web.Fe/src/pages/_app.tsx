import { mainTheme } from "@/app/theme";
import { ThemeProvider } from "@mui/material";
import { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import './../app/globals.css'
import 'react-toastify/dist/ReactToastify.css';

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ThemeProvider theme={mainTheme}>
            <ToastContainer
                position={`top-right`} />
            <Component {...pageProps} />
        </ThemeProvider>
    )
}