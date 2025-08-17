"use client"

import { useState, useRef, ReactNode, TouchEvent, MouseEvent } from 'react'
import { cn } from '@/shared/lib/utils'

interface SwipeAction {
  label: string
  color: 'green' | 'blue' | 'red' | 'yellow'
  icon?: ReactNode
}

interface SwipeableListItemProps {
  children: ReactNode
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  rightAction?: SwipeAction
  leftAction?: SwipeAction
  threshold?: number
  className?: string
}

export function SwipeableListItem({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightAction,
  leftAction,
  threshold = 75,
  className
}: SwipeableListItemProps) {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)
  
  const getTransform = () => {
    if (!isDragging && !isAnimating) return 0
    const diff = currentX - startX
    
    // Add resistance at the edges
    const maxSwipe = 150
    if (Math.abs(diff) > maxSwipe) {
      return Math.sign(diff) * (maxSwipe + (Math.abs(diff) - maxSwipe) * 0.2)
    }
    return diff
  }
  
  const getActionOpacity = () => {
    const diff = Math.abs(currentX - startX)
    return Math.min(diff / threshold, 1)
  }
  
  const getActionColors = (action: SwipeAction) => {
    const colors = {
      green: 'bg-green-500 text-white',
      blue: 'bg-blue-500 text-white',
      red: 'bg-red-500 text-white',
      yellow: 'bg-yellow-500 text-black'
    }
    return colors[action.color]
  }
  
  const handleStart = (clientX: number) => {
    setStartX(clientX)
    setCurrentX(clientX)
    setIsDragging(true)
    setIsAnimating(false)
  }
  
  const handleMove = (clientX: number) => {
    if (!isDragging) return
    setCurrentX(clientX)
  }
  
  const handleEnd = () => {
    if (!isDragging) return
    
    const diff = currentX - startX
    const absDiff = Math.abs(diff)
    
    // Check if swipe exceeded threshold
    if (absDiff > threshold) {
      setIsAnimating(true)
      
      if (diff > 0 && onSwipeRight) {
        // Swipe right animation
        setCurrentX(startX + 300)
        setTimeout(() => {
          onSwipeRight()
          resetPosition()
        }, 300)
      } else if (diff < 0 && onSwipeLeft) {
        // Swipe left animation
        setCurrentX(startX - 300)
        setTimeout(() => {
          onSwipeLeft()
          resetPosition()
        }, 300)
      } else {
        resetPosition()
      }
    } else {
      resetPosition()
    }
  }
  
  const resetPosition = () => {
    setIsAnimating(true)
    setCurrentX(startX)
    setTimeout(() => {
      setIsDragging(false)
      setIsAnimating(false)
      setStartX(0)
      setCurrentX(0)
    }, 300)
  }
  
  // Touch event handlers
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX)
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX)
  }
  
  const handleTouchEnd = () => {
    handleEnd()
  }
  
  // Mouse event handlers (for testing on desktop)
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX)
  }
  
  const handleMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    handleMove(e.clientX)
  }
  
  const handleMouseUp = () => {
    handleEnd()
  }
  
  const handleMouseLeave = () => {
    if (isDragging) {
      resetPosition()
    }
  }
  
  const transform = getTransform()
  const showRightAction = transform > 0 && rightAction
  const showLeftAction = transform < 0 && leftAction
  const actionOpacity = getActionOpacity()
  
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Background actions */}
      {showRightAction && (
        <div 
          className={cn(
            "absolute inset-y-0 left-0 flex items-center px-4",
            getActionColors(rightAction)
          )}
          style={{ 
            opacity: actionOpacity,
            width: Math.abs(transform)
          }}
        >
          <span className="font-medium whitespace-nowrap">
            {rightAction.icon}
            {rightAction.label}
          </span>
        </div>
      )}
      
      {showLeftAction && (
        <div 
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-4",
            getActionColors(leftAction)
          )}
          style={{ 
            opacity: actionOpacity,
            width: Math.abs(transform)
          }}
        >
          <span className="font-medium whitespace-nowrap">
            {leftAction.icon}
            {leftAction.label}
          </span>
        </div>
      )}
      
      {/* Main content */}
      <div
        ref={itemRef}
        className={cn(
          "relative bg-background",
          isDragging && "select-none",
          (isDragging || isAnimating) && "transition-none",
          !isDragging && !isAnimating && "transition-transform duration-300 ease-out"
        )}
        style={{
          transform: `translateX(${transform}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  )
}