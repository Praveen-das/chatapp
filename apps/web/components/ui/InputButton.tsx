import { ChangeEvent, HTMLAttributes, ReactNode, useRef } from "react"

interface IInputButton extends HTMLAttributes<HTMLButtonElement> {
    children: ReactNode,
    onInputChange?: (event: ChangeEvent<HTMLInputElement>) => void,
}

const InputButton = ({ children, onInputChange, ...props }: IInputButton) => {
    const inputRef = useRef<HTMLInputElement>(null)

    function openFileManager() {
        inputRef.current?.click()
    }

    return (
        <button
            {...props}
            onClick={openFileManager}
        >
            <input
                onChange={onInputChange}
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept="image/png, image/gif, image/jpeg"
            />
            {children}
        </button>
    )
}

export default InputButton