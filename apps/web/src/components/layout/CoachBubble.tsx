'use client'

import { MessageCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Persistent coach bubble — always visible in the app shell.
 * Currently disabled (Iteracja 8 will activate it).
 */
export function CoachBubble() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/*
           * Using a <span> styled as a button — disabled button cannot receive
           * pointer events for the tooltip in some browsers.
           */}
          <span
            role="button"
            aria-disabled="true"
            aria-label="Coach AI (wkrótce)"
            className="fixed bottom-[calc(var(--bottom-nav-height)+1rem)] right-4 z-50 flex h-14 w-14 cursor-not-allowed items-center justify-center rounded-full bg-brand/30 text-brand shadow-lg ring-2 ring-brand/20 transition-all select-none"
          >
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="left">Wkrótce</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
