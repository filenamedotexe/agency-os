"use client"

import { useState, useEffect } from 'react'

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  
  useEffect(() => {
    const checkDevice = () => {
      // Check viewport width (include 768px as mobile for iPad Mini)
      const width = window.innerWidth
      setIsMobile(width <= 768)
      setIsTablet(width > 768 && width < 1024)
      
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 ||
                      (navigator as any).msMaxTouchPoints > 0
      setIsTouchDevice(hasTouch)
    }
    
    // Initial check
    checkDevice()
    
    // Listen for resize events
    window.addEventListener('resize', checkDevice)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkDevice)
  }, [])
  
  return {
    isMobile,
    isTablet,
    isTouchDevice,
    isDesktop: !isMobile && !isTablet
  }
}

// Server-side safe version that returns false initially
export function useMobileDetectSSR() {
  const [mounted, setMounted] = useState(false)
  const detection = useMobileDetect()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return {
      isMobile: false,
      isTablet: false,
      isTouchDevice: false,
      isDesktop: true
    }
  }
  
  return detection
}