import { useRef, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { AddComment } from './AddComment'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SpatialContext } from '@/types'

interface FloatingCommentCardProps {
    x: number
    y: number
    spatialContext: SpatialContext
    onClose: () => void
    onSubmit: (content: string, attachments?: File[], color?: string) => Promise<void>
    userName?: string
    onUserNameChange?: (name: string) => void
}

export function FloatingCommentCard({
    x, // Now used as screenX
    y, // Now used as screenY
    onClose,
    onSubmit,
    userName,
    onUserNameChange
}: FloatingCommentCardProps) {
    const { t } = useTranslation(['fileView', 'common'])
    const cardRef = useRef<HTMLDivElement>(null)
    const [selectedColor, setSelectedColor] = useState('#ef4444')
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#000000', '#ffffff']

    const [position, setPosition] = useState({ left: x + 15, top: y + 15, opacity: 0 })

    useEffect(() => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect()
            let newLeft = x + 15
            let newTop = y + 15
            
            // If it goes off the right edge, flip to the left of the cursor
            if (newLeft + rect.width > window.innerWidth - 10) {
                newLeft = x - rect.width - 15
            }
            
            // If it goes off the bottom edge, flip above the cursor
            if (newTop + rect.height > window.innerHeight - 10) {
                newTop = y - rect.height - 15
            }
            
            // Ensure it doesn't go off the top or left edges either
            setPosition({
                left: Math.max(10, newLeft),
                top: Math.max(10, newTop),
                opacity: 1
            })
        }
    }, [x, y])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: globalThis.MouseEvent | TouchEvent) {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                onClose()
            }
        }
        
        // Use a small delay before attaching listener to prevent immediate closing if triggered by a click
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('touchstart', handleClickOutside)
        }, 100)
        
        return () => {
            clearTimeout(timeoutId)
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [onClose])

    return (
        <Card
            ref={cardRef}
            className="fixed z-[999] w-80 p-3 shadow-xl flex flex-col gap-2 animate-in fade-in zoom-in duration-200"
            style={{
                left: `${position.left}px`,
                top: `${position.top}px`,
                opacity: position.opacity,
                transition: 'opacity 0.15s ease-in-out'
            }}
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging the canvas when clicking the card
        >
            <div className="flex items-center justify-between pb-1 border-b border-border/50">
                <h4 className="text-sm font-semibold">{t('fileView:comments.dropPinTitle', { defaultValue: 'Ghim bình luận' })}</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="flex items-center gap-1.5 py-1">
                {colors.map(c => (
                    <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-5 h-5 rounded-full border border-border/50 transition-transform ${selectedColor === c ? 'scale-125 ring-1 ring-ring ring-offset-1' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c }}
                        title="Select color"
                    />
                ))}
            </div>
            
            <AddComment
                userName={userName}
                onUserNameChange={onUserNameChange}
                // We do not pass onAnnotationClick so the pen tool is hidden
                // canCaptureView is false by default since we are contextual
                onSubmit={async (_name, content, _ts, _parentId, _annotation, attachments) => {
                    await onSubmit(content, attachments, selectedColor)
                    onClose()
                }}
            />
        </Card>
    )
}
