import EmojiPicker from '@emoji-mart/react'
import './picker.css'
import { getEmojies } from './getEmojies'

export default function Picker({ open, onEmojiSelect }: { open: boolean, onEmojiSelect: (emoji: any) => void }) {
    return (
        <div className={`${!open ? "hidden" : 'mb-1'}`}>
            <EmojiPicker
                searchPosition='none'
                previewPosition='none'
                dynamicWidth
                emojiButtonSize={45}
                data={getEmojies}
                onEmojiSelect={onEmojiSelect}
            />
        </div>
    )
}
