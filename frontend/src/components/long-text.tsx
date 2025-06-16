import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  asChild?: boolean
  threshold?: number
}

export default function LongText({
  children,
  className = '',
  contentClassName = '',
  asChild = false,
  threshold = 15,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [needsTooltip, setNeedsTooltip] = useState(false)

  useEffect(() => {
    if (ref.current) {
      // Vérifie le débordement visuel ET/OU la longueur du texte
      const isOverflown = 
        ref.current.scrollWidth > ref.current.clientWidth || 
        ref.current.scrollHeight > ref.current.clientHeight
      
      const isLongText = typeof children === 'string' && children.length > threshold
      
      setNeedsTooltip(isOverflown || isLongText)
    }
  }, [children, threshold])

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip disableHoverableContent={!needsTooltip}>
        <TooltipTrigger asChild={asChild}>
          <div
            ref={ref}
            className={cn(
              'truncate overflow-hidden text-ellipsis whitespace-nowrap',
              className
            )}
          >
            {children}
          </div>
        </TooltipTrigger>
        {needsTooltip && (
          <TooltipContent 
            side="top" 
            align="center" 
            className={cn(
              'max-w-[300px] break-words text-sm',
              contentClassName
            )}
          >
            {children}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}