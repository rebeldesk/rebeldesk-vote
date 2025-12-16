/**
 * Componente para renderizar conteúdo Markdown de forma segura.
 * 
 * Suporta formatação básica de Markdown como:
 * - Negrito (**texto**)
 * - Itálico (*texto*)
 * - Listas (- item)
 * - Links ([texto](url))
 * - Quebras de linha
 */

'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          // Estiliza parágrafos
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // Estiliza listas
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          // Estiliza links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          // Estiliza títulos
          h1: ({ children }) => <h1 className="mb-2 text-xl font-bold text-gray-900">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-lg font-semibold text-gray-900">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 text-base font-semibold text-gray-900">{children}</h3>,
          // Estiliza código inline
          code: ({ children }) => (
            <code className="rounded bg-gray-100 px-1 py-0.5 text-sm font-mono text-gray-800">
              {children}
            </code>
          ),
          // Estiliza blocos de código
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded bg-gray-100 p-2 text-sm">
              {children}
            </pre>
          ),
          // Estiliza negrito
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          // Estiliza itálico
          em: ({ children }) => <em className="italic">{children}</em>,
          // Estiliza quebras de linha
          br: () => <br className="block" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
