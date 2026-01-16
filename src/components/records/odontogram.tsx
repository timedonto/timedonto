"use client";

import { useState, useEffect } from 'react';

interface OdontogramProps {
  data: Record<string, string> | null;
  onChange?: (data: Record<string, string>) => void;
  readOnly?: boolean;
}

type ToothStatus = 'saudavel' | 'carie' | 'restaurado' | 'ausente' | 'tratamento';

const TOOTH_STATUSES: ToothStatus[] = ['saudavel', 'carie', 'restaurado', 'ausente', 'tratamento'];

const STATUS_COLORS = {
  saudavel: 'bg-green-200 hover:bg-green-300',
  carie: 'bg-red-300 hover:bg-red-400',
  restaurado: 'bg-blue-300 hover:bg-blue-400',
  ausente: 'bg-gray-400 hover:bg-gray-500',
  tratamento: 'bg-yellow-300 hover:bg-yellow-400',
};

const STATUS_LABELS = {
  saudavel: 'Saudável',
  carie: 'Cárie',
  restaurado: 'Restaurado',
  ausente: 'Ausente',
  tratamento: 'Em Tratamento',
};

// Dental arch layout
const UPPER_RIGHT = ['18', '17', '16', '15', '14', '13', '12', '11'];
const UPPER_LEFT = ['21', '22', '23', '24', '25', '26', '27', '28'];
const LOWER_LEFT = ['31', '32', '33', '34', '35', '36', '37', '38'];
const LOWER_RIGHT = ['41', '42', '43', '44', '45', '46', '47', '48'];

export function Odontogram({ data, onChange, readOnly = true }: OdontogramProps) {
  const [toothData, setToothData] = useState<Record<string, string>>(data || {});

  useEffect(() => {
    setToothData(data || {});
  }, [data]);

  const handleToothClick = (toothNumber: string) => {
    if (readOnly || !onChange) return;

    const currentStatus = toothData[toothNumber] || 'saudavel';
    const currentIndex = TOOTH_STATUSES.indexOf(currentStatus as ToothStatus);
    const nextIndex = (currentIndex + 1) % TOOTH_STATUSES.length;
    const nextStatus = TOOTH_STATUSES[nextIndex];

    const newData = {
      ...toothData,
      [toothNumber]: nextStatus,
    };

    setToothData(newData);
    onChange(newData);
  };

  const getToothColor = (toothNumber: string): string => {
    const status = toothData[toothNumber] as ToothStatus || 'saudavel';
    return STATUS_COLORS[status];
  };

  const ToothComponent = ({ number }: { number: string }) => (
    <button
      type="button"
      onClick={() => handleToothClick(number)}
      disabled={readOnly}
      className={`
        w-10 h-10 border border-gray-300 rounded flex items-center justify-center
        text-xs font-medium text-gray-700 transition-colors duration-200
        ${getToothColor(number)}
        ${!readOnly ? 'cursor-pointer' : 'cursor-default'}
        ${readOnly ? '' : 'hover:scale-105 transform transition-transform'}
      `}
      title={`Dente ${number} - ${STATUS_LABELS[toothData[number] as ToothStatus || 'saudavel']}`}
    >
      {number}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Legend */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legenda:</h3>
        <div className="flex flex-wrap gap-3">
          {TOOTH_STATUSES.map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${STATUS_COLORS[status].split(' ')[0]} border border-gray-300`} />
              <span className="text-xs text-gray-600">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Odontogram */}
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Upper Arch */}
          <div className="mb-4">
          <div className="text-center text-xs text-gray-500 mb-2">Arcada Superior</div>
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
          <div className="text-center text-xs text-gray-500 mt-2">Arcada Inferior</div>
        </div>
        </div>
      </div>

      {/* Instructions */}
      {!readOnly && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Clique nos dentes para alterar o status
        </div>
      )}
    </div>
  );
}