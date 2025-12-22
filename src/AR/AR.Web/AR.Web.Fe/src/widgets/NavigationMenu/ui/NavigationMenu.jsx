import { Wrapper } from "./Wrapper"
import { ItemsWrapper } from "./ItemsWrapper"
import { Notch } from "./Notch"
import { useEffect, useRef, useState } from "react"

export const NavigationMenu = () => {

    const [isShown, setIsShown] = useState(false)
    const itemsWrapper = useRef(null)

    useEffect(() => {
        if(isShown) {
            itemsWrapper.current.show()
        }
    }, [isShown])

    return (
        <Wrapper
            onMouseEnter={() => {
                setIsShown(true)
            }}
            onMouseLeave={() => {
                setIsShown(false)
            }}>
            <ItemsWrapper innerRef={itemsWrapper} isShown={isShown}></ItemsWrapper>
            <Notch isShown={isShown}></Notch>
        </Wrapper>
    )
}