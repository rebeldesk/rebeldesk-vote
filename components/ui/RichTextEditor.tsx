/**
 * Editor de texto rico com botões de formatação.
 * 
 * Permite formatar texto sem conhecer Markdown, inserindo
 * a sintaxe automaticamente através de botões.
 */

'use client';

import { useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
  name?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite a descrição da votação...',
  rows = 5,
  id,
  name,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Função para inserir texto na posição do cursor
  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    // Se há texto selecionado, envolve com a formatação
    const newText = selectedText
      ? `${beforeText}${before}${selectedText}${after}${afterText}`
      : `${beforeText}${before}${after}${afterText}`;

    onChange(newText);

    // Reposiciona o cursor
    setTimeout(() => {
      if (textarea) {
        const newPosition = selectedText
          ? start + before.length + selectedText.length + after.length
          : start + before.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Funções de formatação
  const formatBold = () => insertText('**', '**');
  const formatItalic = () => insertText('*', '*');
  const formatLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    // Se há texto selecionado, usa como texto do link
    if (selectedText) {
      const newText = `${beforeText}[${selectedText}](https://exemplo.com)${afterText}`;
      onChange(newText);
      setTimeout(() => {
        if (textarea) {
          const newPosition = start + selectedText.length + 3; // Após o texto do link
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition + 18); // Seleciona a URL
        }
      }, 0);
    } else {
      // Insere template de link
      const newText = `${beforeText}[texto do link](https://exemplo.com)${afterText}`;
      onChange(newText);
      setTimeout(() => {
        if (textarea) {
          const newPosition = start + 13; // Após "texto do link"
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition + 18); // Seleciona a URL
        }
      }, 0);
    }
  };

  const formatList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    // Se há texto selecionado, converte em lista
    if (selectedText) {
      const lines = selectedText.split('\n');
      const listItems = lines
        .filter(line => line.trim())
        .map(line => `- ${line.trim()}`)
        .join('\n');
      const newText = `${beforeText}${listItems}${afterText}`;
      onChange(newText);
    } else {
      // Insere item de lista
      const newText = `${beforeText}- Item da lista${afterText}`;
      onChange(newText);
      setTimeout(() => {
        if (textarea) {
          const newPosition = start + 2; // Após o "- "
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition + 13); // Seleciona "Item da lista"
        }
      }, 0);
    }
  };

  const formatLineBreak = () => insertText('\n\n', '');

  return (
    <div>
      {/* Barra de ferramentas */}
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-gray-300 bg-gray-50 p-2">
        <button
          type="button"
          onClick={formatBold}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
          title="Negrito (Ctrl+B)"
          aria-label="Negrito"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={formatItalic}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
          title="Itálico"
          aria-label="Itálico"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
          </svg>
        </button>

        <div className="h-6 w-px bg-gray-300" />

        <button
          type="button"
          onClick={formatLink}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
          title="Inserir link"
          aria-label="Inserir link"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>

        <button
          type="button"
          onClick={formatList}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
          title="Lista com marcadores"
          aria-label="Lista"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <button
          type="button"
          onClick={formatLineBreak}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200"
          title="Quebra de linha"
          aria-label="Quebra de linha"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16" />
          </svg>
        </button>

        <div className="ml-auto">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
            title="Mostrar ajuda"
          >
            {showHelp ? 'Ocultar' : 'Ajuda'} ℹ️
          </button>
        </div>
      </div>

      {/* Ajuda */}
      {showHelp && (
        <div className="mb-2 rounded-md bg-blue-50 p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">Dicas de formatação:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Selecione o texto</strong> e clique nos botões para formatar</li>
            <li><strong>Negrito:</strong> Selecione o texto e clique no botão B</li>
            <li><strong>Itálico:</strong> Selecione o texto e clique no botão I</li>
            <li><strong>Link:</strong> Selecione o texto e clique no botão de link, depois edite a URL</li>
            <li><strong>Lista:</strong> Selecione várias linhas e clique no botão de lista</li>
          </ul>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
      />

      {/* Preview rápido (opcional) */}
      {value && (
        <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
          <p className="font-semibold mb-1">Preview:</p>
          <div className="text-gray-700">
            {value.length > 100 ? `${value.substring(0, 100)}...` : value}
          </div>
        </div>
      )}
    </div>
  );
}
