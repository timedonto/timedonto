"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToothFacesSelectorProps {
  selectedFaces: string[]
  onChange: (faces: string[]) => void
  disabled?: boolean
}

const FACE_LABELS: Record<string, string> = {
  O: 'Oclusal',
  M: 'Mesial',
  D: 'Distal',
  V: 'Vestibular',
  L: 'Lingual'
}

export function ToothFacesSelector({ 
  selectedFaces, 
  onChange, 
  disabled = false 
}: ToothFacesSelectorProps) {
  const toggleFace = (face: string) => {
    if (disabled) return
    
    if (selectedFaces.includes(face)) {
      onChange(selectedFaces.filter(f => f !== face))
    } else {
      onChange([...selectedFaces, face])
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Faces do dente selecionado
      </h3>
      <div className="flex flex-col items-center">
        <div className="relative w-[120px] h-[120px] mb-6">
          {/* Face Top - Vestibular (V) */}
          <button
            type="button"
            onClick={() => toggleFace('V')}
            disabled={disabled}
            className={cn(
              "absolute top-0 left-0 w-full h-[30px] border border-gray-300 rounded-t",
              "flex items-center justify-center text-[10px] font-bold transition-all",
              "clip-path-top",
              selectedFaces.includes('V')
                ? "bg-primary text-primary-foreground border-primary shadow-inner"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)'
            }}
          >
            V
          </button>

          {/* Face Bottom - Lingual (L) */}
          <button
            type="button"
            onClick={() => toggleFace('L')}
            disabled={disabled}
            className={cn(
              "absolute bottom-0 left-0 w-full h-[30px] border border-gray-300 rounded-b",
              "flex items-center justify-center text-[10px] font-bold transition-all",
              "clip-path-bottom",
              selectedFaces.includes('L')
                ? "bg-primary text-primary-foreground border-primary shadow-inner"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              clipPath: 'polygon(25% 0, 75% 0, 100% 100%, 0 100%)'
            }}
          >
            L
          </button>

          {/* Face Left - Mesial (M) */}
          <button
            type="button"
            onClick={() => toggleFace('M')}
            disabled={disabled}
            className={cn(
              "absolute top-0 left-0 w-[30px] h-full border border-gray-300 rounded-l",
              "flex items-center justify-center text-[10px] font-bold transition-all",
              "clip-path-left",
              selectedFaces.includes('M')
                ? "bg-primary text-primary-foreground border-primary shadow-inner"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              clipPath: 'polygon(0 0, 100% 25%, 100% 75%, 0 100%)'
            }}
          >
            M
          </button>

          {/* Face Right - Distal (D) */}
          <button
            type="button"
            onClick={() => toggleFace('D')}
            disabled={disabled}
            className={cn(
              "absolute top-0 right-0 w-[30px] h-full border border-gray-300 rounded-r",
              "flex items-center justify-center text-[10px] font-bold transition-all",
              "clip-path-right",
              selectedFaces.includes('D')
                ? "bg-primary text-primary-foreground border-primary shadow-inner"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              clipPath: 'polygon(0 25%, 100% 0, 100% 100%, 0 75%)'
            }}
          >
            D
          </button>

          {/* Face Center - Oclusal (O) */}
          <button
            type="button"
            onClick={() => toggleFace('O')}
            disabled={disabled}
            className={cn(
              "absolute top-[30px] left-[30px] w-[60px] h-[60px] border border-gray-300 rounded",
              "flex items-center justify-center text-xs font-bold transition-all shadow-inner",
              selectedFaces.includes('O')
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:bg-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            O
          </button>
        </div>

        {/* Selected faces tags */}
        {selectedFaces.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {selectedFaces.map((face) => (
              <span
                key={face}
                className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold"
              >
                {FACE_LABELS[face]} Selecionada
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Selecione pelo menos uma face
          </p>
        )}
      </div>
    </div>
  )
}
