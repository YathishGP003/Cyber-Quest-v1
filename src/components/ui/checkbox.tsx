"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setChecked(e.target.checked)
      props.onChange?.(e)
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="relative">
          <input
            type="checkbox"
            ref={ref}
            className="sr-only"
            checked={checked}
            onChange={handleChange}
            {...props}
          />
          <div
            className={cn(
              "peer h-4 w-4 shrink-0 rounded-sm border border-gray-200 border-gray-900 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-500 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-800",
              checked ? "bg-blue-600 dark:bg-blue-600" : "bg-white dark:bg-slate-900",
              className
            )}
            onClick={() => {
              const newChecked = !checked
              setChecked(newChecked)
              // Simulate an event to pass to the onChange handler
              const event = {
                target: { checked: newChecked }
              } as React.ChangeEvent<HTMLInputElement>
              props.onChange?.(event)
            }}
          >
            {checked && (
              <div className="flex items-center justify-center text-white dark:text-slate-50">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </div>
        {label && <span className="text-sm">{label}</span>}
      </div>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }