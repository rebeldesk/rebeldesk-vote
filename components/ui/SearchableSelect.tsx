/**
 * Componente de select com busca (searchable select).
 * 
 * Permite buscar e selecionar opções de uma lista.
 */

'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  emptyMessage = 'Nenhuma opção encontrada',
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1); // -1 = "Nenhuma", 0+ = opções
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtra opções baseado no termo de busca
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontra a opção selecionada
  const selectedOption = options.find((opt) => opt.value === value);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Foca no input quando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reseta highlight quando filtra
  useEffect(() => {
    setHighlightedIndex(-1); // Começa com -1 (Nenhuma)
  }, [searchTerm]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue === '' ? null : optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const maxIndex = filteredOptions.length - 1;
          // Se está em -1 (Nenhuma), vai para 0 (primeira opção)
          // Se está em uma opção, avança até o máximo
          return prev < maxIndex ? prev + 1 : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => {
          // Se está em 0 ou acima, volta para -1 (Nenhuma)
          // Se está em -1, fica em -1
          return prev > -1 ? prev - 1 : -1;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex === -1) {
          handleSelect('');
        } else if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Botão que abre o dropdown */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        className={`relative mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-left text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${
          disabled ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'cursor-pointer text-gray-900'
        } ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg">
          {/* Campo de busca */}
          <div className="border-b border-gray-200 p-2">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Lista de opções */}
          <div className="max-h-60 overflow-auto">
            {/* Opção "Nenhuma" */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                value === null
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-900'
              } ${
                highlightedIndex === -1 ? 'bg-gray-100' : ''
              }`}
            >
              Nenhuma
            </button>

            {/* Opções filtradas */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                    value === option.value
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-900'
                  } ${
                    highlightedIndex === index ? 'bg-gray-100' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
