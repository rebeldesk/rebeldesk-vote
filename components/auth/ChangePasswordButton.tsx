/**
 * Botão que abre o modal de alteração de senha.
 * 
 * Componente reutilizável que pode ser usado em qualquer lugar.
 */

'use client';

import { useState } from 'react';
import { ChangePasswordModal } from './ChangePasswordModal';

interface ChangePasswordButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function ChangePasswordButton({
  className = '',
  children,
}: ChangePasswordButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
        title="Alterar senha"
      >
        {children || '🔒'}
      </button>
      <ChangePasswordModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

