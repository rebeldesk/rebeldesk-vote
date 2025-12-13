/**
 * Componente de abas reutilizável.
 * 
 * Exibe um sistema de abas com conteúdo dinâmico.
 */

'use client';

import { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  if (tabs.length === 0) {
    return null;
  }

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="bg-white shadow sm:rounded-lg">
      {/* Cabeçalho das abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="px-4 py-5 sm:p-6">{activeTabContent}</div>
    </div>
  );
}
