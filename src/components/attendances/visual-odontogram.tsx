"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VisualOdontogramProps {
  selectedTooth?: string
}

// Dental arch layout - numeração padrão
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11']
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28']
const LOWER_LEFT = ['48', '47', '46', '45', '44', '43', '42', '41']
const LOWER_RIGHT = ['31', '32', '33', '34', '35', '36', '37', '38']

export function VisualOdontogram({ selectedTooth }: VisualOdontogramProps) {
  const isSelected = (toothNumber: string) => selectedTooth === toothNumber

  const ToothComponent = ({ number }: { number: string }) => (
    <div
      className={`
        w-10 h-10 border border-gray-300 rounded flex items-center justify-center
        text-xs font-medium transition-colors duration-200
        ${isSelected(number) 
          ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105' 
          : 'bg-white text-gray-700 hover:bg-gray-50'
        }
      `}
      title={`Dente ${number}`}
    >
      {number}
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <span className="text-primary">📊</span>
          Odontograma Anatômico
        </CardTitle>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            Adulto
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium">
            Infantil
          </span>
        </div>
      </CardHeader>
      <CardContent className="bg-muted/30 rounded-b-lg pt-6">
        <div className="w-full max-w-2xl mx-auto p-4">
          {/* Upper Arch */}
          <div className="mb-4">
            <div className="text-center text-xs text-muted-foreground mb-2">
              Arcada Superior
            </div>
            <div className="flex justify-center gap-1">
              {/* Upper Right Quadrant */}
              <div className="flex gap-1">
                {UPPER_RIGHT.map((tooth) => (
                  <ToothComponent key={tooth} number={tooth} />
                ))}
              </div>
              
              {/* Central Divider */}
              <div className="w-px bg-gray-400 mx-2 self-stretch" />
              
              {/* Upper Left Quadrant */}
              <div className="flex gap-1">
                {UPPER_LEFT.map((tooth) => (
                  <ToothComponent key={tooth} number={tooth} />
                ))}
              </div>
            </div>
          </div>

          {/* Horizontal Divider */}
          <div className="h-px bg-gray-400 my-4" />

          {/* Lower Arch */}
          <div>
            <div className="flex justify-center gap-1">
              {/* Lower Right Quadrant */}
              <div className="flex gap-1">
                {LOWER_RIGHT.map((tooth) => (
                  <ToothComponent key={tooth} number={tooth} />
                ))}
              </div>
              
              {/* Central Divider */}
              <div className="w-px bg-gray-400 mx-2 self-stretch" />
              
              {/* Lower Left Quadrant */}
              <div className="flex gap-1">
                {LOWER_LEFT.map((tooth) => (
                  <ToothComponent key={tooth} number={tooth} />
                ))}
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-2">
              Arcada Inferior
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
