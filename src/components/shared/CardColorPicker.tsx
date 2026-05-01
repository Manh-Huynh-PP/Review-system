import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Palette, RotateCcw, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { PRESET_COLORS } from "@/constants/colors"

interface CardColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string | undefined) => void;
  align?: "center" | "start" | "end";
}


export function CardColorPicker({ currentColor, onColorChange, align = "center" }: CardColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 rounded-full transition-all hover:scale-110 shadow-sm border border-white/20",
            currentColor ? "text-white" : "text-muted-foreground bg-background/50 backdrop-blur-sm"
          )}
          style={{ backgroundColor: currentColor }}
          title="Tùy chỉnh màu sắc thẻ"
        >
          <Palette className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-64 p-3 bg-background/95 backdrop-blur-md border-primary/20 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-primary" />
              Studio Labels
            </h4>
            {currentColor && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-[10px] hover:text-primary gap-1"
                onClick={() => onColorChange(undefined)}
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.name}
                className={cn(
                  "w-9 h-9 rounded-md border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center relative group",
                  currentColor === color.value ? "border-primary shadow-md ring-2 ring-primary/20" : "border-transparent hover:border-primary/30"
                )}
                title={color.label}
                onClick={() => onColorChange(color.value)}
                style={{ backgroundColor: color.value || 'transparent' }}
              >
                {color.value === undefined && (
                  <div className="absolute inset-0 border-2 border-dashed border-muted-foreground/30 rounded-md" />
                )}
                {currentColor === color.value && (
                  <Check className={cn("w-4 h-4", color.value ? "text-white" : "text-primary")} />
                )}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 shrink-0">
                <Input
                  type="color"
                  value={currentColor || "#ffffff"}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div 
                  className="w-full h-full rounded-md border-2 shadow-inner transition-colors flex items-center justify-center"
                  style={{ backgroundColor: currentColor || "#ffffff" }}
                >
                  {!currentColor && <Palette className="w-4 h-4 text-muted-foreground/50" />}
                </div>
              </div>
              <Input
                type="text"
                placeholder="#HEX color"
                value={currentColor || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('#') || val === '') {
                    onColorChange(val || undefined);
                  }
                }}
                className="h-9 text-xs font-mono lowercase border-primary/10"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
