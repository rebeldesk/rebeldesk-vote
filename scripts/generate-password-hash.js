/**
 * Script para gerar hash de senha usando bcrypt.
 * 
 * Uso: node scripts/generate-password-hash.js "sua_senha"
 */

const bcrypt = require('bcryptjs');

const senha = process.argv[2];

if (!senha) {
  console.error('Uso: node scripts/generate-password-hash.js "sua_senha"');
  process.exit(1);
}

const hash = bcrypt.hashSync(senha, 10);
console.log('Senha:', senha);
console.log('Hash:', hash);

