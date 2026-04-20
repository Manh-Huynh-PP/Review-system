import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Info, AlertCircle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
  variant?: 'default' | 'destructive' | 'warning' | 'info'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelText,
  confirmText,
  onConfirm,
  variant = 'default'
}: ConfirmDialogProps) {
  const { t } = useTranslation('common')
  const finalCancelText = cancelText || t('actions.cancel')
  const finalConfirmText = confirmText || t('actions.confirm')
  
  const getIcon = () => {
    switch (variant) {
      case 'destructive': return <AlertCircle className="w-6 h-6 text-destructive" />
      case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-500" />
      case 'info': return <Info className="w-6 h-6 text-blue-500" />
      default: return <HelpCircle className="w-6 h-6 text-primary" />
    }
  }

  const getActionButtonClass = () => {
    switch (variant) {
      case 'destructive': return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      case 'warning': return 'bg-amber-500 text-white hover:bg-amber-600'
      case 'info': return 'bg-blue-500 text-white hover:bg-blue-600'
      default: return 'bg-primary text-primary-foreground hover:bg-primary/90'
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        overlayClassName="!z-[2147483646] pointer-events-auto!"
        className="sm:max-w-[425px] overflow-hidden border-none shadow-2xl !z-[2147483647] pointer-events-auto!"
        style={{ zIndex: 2147483647 }}
      >
        {/* Subtle background glow */}
        <div className={cn(
          "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10",
          variant === 'destructive' ? 'bg-destructive' : 
          variant === 'warning' ? 'bg-amber-500' : 
          variant === 'info' ? 'bg-blue-500' : 'bg-primary'
        )} />
        
        <AlertDialogHeader className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "p-2 rounded-full",
              variant === 'destructive' ? 'bg-destructive/10' : 
              variant === 'warning' ? 'bg-amber-500/10' : 
              variant === 'info' ? 'bg-blue-500/10' : 'bg-primary/10'
            )}>
              {getIcon()}
            </div>
            <AlertDialogTitle className="text-xl font-bold tracking-tight">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-base leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="mt-8 relative z-10 gap-3 sm:gap-0">
          <AlertDialogCancel 
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none border-muted-foreground/20 hover:bg-muted/50 transition-colors"
          >
            {finalCancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
              // Usually onConfirm will handle closing if it's tied to the 'open' state in parent
            }}
            className={cn("flex-1 sm:flex-none font-semibold shadow-lg transition-all active:scale-95", getActionButtonClass())}
          >
            {finalConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
