/**
 * Componente de filtros rápidos reutilizável.
 */

'use client';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface QuickFiltersProps {
  filters: FilterOption[];
  selectedFilter: string;
  onFilterChange: (value: string) => void;
  label?: string;
}

export function QuickFilters({
  filters,
  selectedFilter,
  onFilterChange,
  label = 'Filtros',
}: QuickFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-700">{label}:</span>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selectedFilter === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
