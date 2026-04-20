import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { i18n } = useTranslation()

  const toggleLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLanguage = i18n.language

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => toggleLanguage('vi')}
          className={currentLanguage.startsWith('vi') ? 'bg-accent' : ''}
        >
          Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => toggleLanguage('en')}
          className={currentLanguage.startsWith('en') ? 'bg-accent' : ''}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
