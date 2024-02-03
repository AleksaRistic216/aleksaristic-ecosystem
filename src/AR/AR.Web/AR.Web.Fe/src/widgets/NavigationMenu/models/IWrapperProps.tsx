import { ReactNode } from "react";

export interface IWrapperProps {
    children?: ReactNode,
    onMouseEnter?: () => void,
    onMouseLeave?: () => void
}