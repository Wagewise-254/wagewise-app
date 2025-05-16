// src/components/ui/textarea.tsx
import * as React from "react"
import { cn } from "@/lib/utils"; // Assuming you use cn from shadcn/ui

// Wrap the component definition with React.forwardRef
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  // The render function inside forwardRef receives props and the ref as the second argument
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref} // <--- This is the key! Pass the received ref down to the native <textarea> element
        {...props} // <--- Ensure all other props are spread
      />
    )
  }
)

// Add a display name for better debugging
Textarea.displayName = "Textarea" // Good practice

export { Textarea }