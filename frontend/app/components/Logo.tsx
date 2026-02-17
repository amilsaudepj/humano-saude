"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

// ============================================
// LOGO COMPONENT - Humano Saúde
// ============================================

interface LogoProps {
  variant?: "1" | "2" | "3" | "icon" // Escolha qual logo usar
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean // Se false, mostra apenas o ícone
  withBackground?: boolean
}

const sizeMap = {
  sm: { width: 120, height: 30 },
  md: { width: 180, height: 45 },
  lg: { width: 240, height: 60 },
  xl: { width: 320, height: 80 }
}

const iconSizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 }
}

export default function Logo({ 
  variant = "1", 
  size = "md", 
  className,
  showText = true,
  withBackground = true,
}: LogoProps) {
  const logoPath = `/images/logos/LOGO ${variant} SEM FUNDO.png`
  const dimensions = showText ? sizeMap[size] : iconSizeMap[size]

  return (
    <div className={cn("relative flex items-center", className)}>
      <Image
        src={logoPath}
        alt="Humano Saúde"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className={cn("rounded-sm object-contain", withBackground && "bg-black")}
      />
    </div>
  )
}

// ============================================
// LOGO WITH GOLD GRADIENT OVERLAY
// ============================================

interface LogoGoldProps extends LogoProps {
  goldIntensity?: number // 0 a 100
}

export function LogoGold({ 
  variant = "1",
  size = "md",
  className,
  showText = true,
  goldIntensity = 50,
  withBackground = true,
}: LogoGoldProps) {
  const logoPath = `/images/logos/LOGO ${variant} SEM FUNDO.png`
  const dimensions = showText ? sizeMap[size] : iconSizeMap[size]

  return (
    <div className={cn("relative flex items-center group", className)}>
      <div className="relative">
        <Image
          src={logoPath}
          alt="Humano Saúde"
          width={dimensions.width}
          height={dimensions.height}
          priority
          className={cn("rounded-sm object-contain transition-all duration-300", withBackground && "bg-black")}
        />
        
        {/* Gold Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-[#F6E05E] mix-blend-overlay transition-opacity duration-300 group-hover:opacity-75"
          style={{ opacity: goldIntensity / 100 }}
        />
      </div>
    </div>
  )
}

// ============================================
// LOGO ICON ONLY (Para Sidebar Collapsed)
// ============================================

export function LogoIcon({ 
  variant = "1",
  size = "md",
  className
}: Omit<LogoProps, "showText">) {
  return (
    <Logo 
      variant={variant}
      size={size}
      showText={false}
      className={className}
    />
  )
}

// ============================================
// LOGO WITH GRADIENT TEXT
// ============================================

export function LogoWithGradientText({ 
  variant = "1",
  size = "md",
  className,
  withBackground = true,
}: LogoProps) {
  const logoPath = `/images/logos/LOGO ${variant} SEM FUNDO.png`
  const dimensions = sizeMap[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={logoPath}
        alt="Humano Saúde"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className={cn("rounded-sm object-contain", withBackground && "bg-black")}
      />
      
      <div className="flex flex-col">
        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F6E05E]">
          Humano Saúde
        </span>
        <span className="text-[10px] text-white/40">
          Enterprise
        </span>
      </div>
    </div>
  )
}
