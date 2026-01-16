/**
 * Utilitários para máscaras e validações de campos de formulário
 */

/**
 * Formatar telefone no padrão brasileiro (11) 99999-9999
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica a máscara baseado no tamanho
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 7) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

/**
 * Formatar CPF no padrão brasileiro 999.999.999-99
 */
export function formatCPF(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '')
  
  // Limita a 11 dígitos
  const limited = numbers.slice(0, 11)
  
  // Aplica a máscara baseado no tamanho
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }
}

/**
 * Validar CPF usando algoritmo de dígitos verificadores
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) {
    return false
  }
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(numbers)) {
    return false
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i)
  }
  
  let remainder = sum % 11
  const firstDigit = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(numbers[9]) !== firstDigit) {
    return false
  }
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i)
  }
  
  remainder = sum % 11
  const secondDigit = remainder < 2 ? 0 : 11 - remainder
  
  return parseInt(numbers[10]) === secondDigit
}

/**
 * Validar email usando regex simples
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return true // Email é opcional
  }
  
  // Regex básica para validação de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Remove máscara de telefone, mantendo apenas números
 */
export function unmaskPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Remove máscara de CPF, mantendo apenas números
 */
export function unmaskCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}