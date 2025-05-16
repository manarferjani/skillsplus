import React, { ChangeEvent, useLayoutEffect, useRef, useState } from 'react'

export interface AutoSizeInputProps {
  value: string
  placeholder: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  className?: string
}

const AutoSizeInput: React.FC<AutoSizeInputProps> = ({ value, onChange, placeholder, className }) => {
  const [mounted, setMounted] = useState(false)
  const spanRef = useRef<HTMLSpanElement>(null)
  const [inputWidth, setInputWidth] = useState<number | null>(null)

  const commonStyles = { padding: '0.25rem', fontSize: '0.875rem' } // équivalent à p-1 et text-sm en Tailwind

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (mounted && spanRef.current) {
      const newWidth = spanRef.current.getBoundingClientRect().width
      console.log('Measured width:', newWidth)
      if (newWidth > 0 && newWidth !== inputWidth) {
        setInputWidth(newWidth)
      }
    }
  }, [value, placeholder, mounted]) 

  return (
    <div className="relative inline-block">
      {mounted ? (
        <>
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            style={{ ...commonStyles, width: inputWidth !== null ? `${inputWidth}px` : 'auto' }}
            className={`border-none outline-none ${className || ''}`}
          />
          <span
            ref={spanRef}
            style={commonStyles}
            className="absolute top-0 left-0 whitespace-pre invisible"
          >
            {value || placeholder}
          </span>
        </>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          style={commonStyles}
          className={`border-none outline-none ${className || ''}`}
        />
      )}
    </div>
  )
}

export default AutoSizeInput
