/**
 * Componente de link de navegação que detecta automaticamente se está ativo.
 * 
 * Usa usePathname para detectar a rota atual e aplicar estilos diferentes
 * quando o link está ativo.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  exact?: boolean; // Se true, só marca como ativo se for exatamente igual
}

export function NavLink({ href, children, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  
  // Verifica se o link está ativo
  const isActive = exact 
    ? pathname === href 
    : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
        isActive
          ? 'border-blue-500 text-gray-900'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {children}
    </Link>
  );
}
