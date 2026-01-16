/**
 * Testes para as funções de máscara e validação
 * Para executar: npm test (se configurado)
 */

import { formatPhone, formatCPF, validateCPF, validateEmail } from '../masks'

// Testes de formatação de telefone
console.log('=== TESTES DE FORMATAÇÃO DE TELEFONE ===')
console.log('11999998888 ->', formatPhone('11999998888')) // (11) 99999-8888
console.log('1199999 ->', formatPhone('1199999')) // (11) 99999
console.log('11 ->', formatPhone('11')) // (11) 
console.log('abc123def456 ->', formatPhone('abc123def456')) // (12) 3456
console.log('')

// Testes de formatação de CPF
console.log('=== TESTES DE FORMATAÇÃO DE CPF ===')
console.log('12345678901 ->', formatCPF('12345678901')) // 123.456.789-01
console.log('123456789 ->', formatCPF('123456789')) // 123.456.789
console.log('123456 ->', formatCPF('123456')) // 123.456
console.log('123 ->', formatCPF('123')) // 123
console.log('abc123def456ghi789 ->', formatCPF('abc123def456ghi789')) // 123.456.789-01
console.log('')

// Testes de validação de CPF
console.log('=== TESTES DE VALIDAÇÃO DE CPF ===')
console.log('11144477735 válido?', validateCPF('11144477735')) // true
console.log('111.444.777-35 válido?', validateCPF('111.444.777-35')) // true
console.log('11111111111 válido?', validateCPF('11111111111')) // false (todos iguais)
console.log('12345678901 válido?', validateCPF('12345678901')) // false (dígitos inválidos)
console.log('123456789 válido?', validateCPF('123456789')) // false (menos de 11 dígitos)
console.log('')

// Testes de validação de email
console.log('=== TESTES DE VALIDAÇÃO DE EMAIL ===')
console.log('test@example.com válido?', validateEmail('test@example.com')) // true
console.log('usuario@dominio.com.br válido?', validateEmail('usuario@dominio.com.br')) // true
console.log('email_invalido válido?', validateEmail('email_invalido')) // false
console.log('@dominio.com válido?', validateEmail('@dominio.com')) // false
console.log('test@ válido?', validateEmail('test@')) // false
console.log('"" (vazio) válido?', validateEmail('')) // true (opcional)
console.log('')

export {} // Para tornar este arquivo um módulo