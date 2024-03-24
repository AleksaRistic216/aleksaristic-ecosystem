import { ReactNode } from "react";

export interface IItemProps {
    icon?: ReactNode,
    text: string,
    onClick: () => void
}