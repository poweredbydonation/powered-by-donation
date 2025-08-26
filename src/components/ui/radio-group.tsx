import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupProps {
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface RadioGroupItemProps {
  value: string
  id?: string
  className?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    const groupName = React.useId() // Generate unique group name
    
    const handleChange = (childValue: string) => {
      onValueChange?.(childValue)
    }
    
    return (
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              name: groupName,
              checked: child.props.value === value,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                  handleChange(child.props.value)
                }
              },
            })
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps & React.InputHTMLAttributes<HTMLInputElement>
>(({ className, value, id, checked, onChange, name, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked || false}
      onChange={onChange}
      className={cn(
        "h-4 w-4 rounded-full border border-blue-600 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }