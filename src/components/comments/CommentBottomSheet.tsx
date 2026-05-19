import { useEffect, useState } from 'react'
import { AddComment } from './AddComment'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { SpatialContext } from '@/types'

interface CommentBottomSheetProps {
    spatialContext: SpatialContext
    onClose: () => void
    onSubmit: (content: string, attachments?: File[], color?: string) => Promise<void>
    userName?: string
    onUserNameChange?: (name: string) => void
}

export function CommentBottomSheet({
    onClose,
    onSubmit,
    userName,
    onUserNameChange
}: CommentBottomSheetProps) {
    const { t } = useTranslation(['fileView', 'common'])
    const [selectedColor, setSelectedColor] = useState('#ef4444')
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#000000', '#ffffff']

    // Prevent body scrolling when sheet is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />
            
            {/* Sheet */}
            <div 
                className="relative bg-background border-t border-border rounded-t-2xl p-4 pb-safe shadow-2xl animate-in slide-in-from-bottom-full duration-300"
                onPointerDown={(e) => e.stopPropagation()} // Prevent touches passing through
            >
                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
                
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold">{t('fileView:comments.dropPinTitle', { defaultValue: 'Ghim bình luận' })}</h4>
                    <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-2 mb-3 px-1">
                    {colors.map(c => (
                        <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`w-6 h-6 rounded-full border border-border/50 transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-ring ring-offset-2' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                            title="Select color"
                        />
                    ))}
                </div>
                
                <AddComment
                    userName={userName}
                    onUserNameChange={onUserNameChange}
                    isMobile={true}
                    // Hide annotations, simplified form
                    onSubmit={async (_name, content, _ts, _parentId, _annotation, attachments) => {
                        await onSubmit(content, attachments, selectedColor)
                        onClose()
                    }}
                />
            </div>
        </div>
    )
}
