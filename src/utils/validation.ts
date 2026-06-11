/**
 * Validação de entradas (espelha as constraints do banco)
 */

export const MAX_AMOUNT = 100_000_000;
export const MAX_DESCRIPTION = 120;
export const MAX_NOTES = 500;
export const MIN_PASSWORD = 8;

export interface TransactionInput {
  description: string;
  amount: number;
  date: string;
  notes?: string;
}

/** Retorna mensagem de erro ou null se válido */
export function validateTransaction(input: TransactionInput): string | null {
  const description = input.description.trim();
  if (!description) return 'Informe uma descrição.';
  if (description.length > MAX_DESCRIPTION)
    return `A descrição deve ter no máximo ${MAX_DESCRIPTION} caracteres.`;

  if (!Number.isFinite(input.amount) || input.amount <= 0)
    return 'Informe um valor maior que zero.';
  if (input.amount > MAX_AMOUNT) return 'Valor acima do limite permitido.';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return 'Informe uma data válida.';

  if (input.notes && input.notes.length > MAX_NOTES)
    return `As notas devem ter no máximo ${MAX_NOTES} caracteres.`;

  return null;
}

/** Retorna mensagem de erro ou null se válido */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD)
    return `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password))
    return 'A senha deve conter letras e números.';
  return null;
}

/** Valida valores monetários genéricos (metas, orçamentos, salários) */
export function validateAmount(amount: number, label = 'valor'): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return `Informe um ${label} maior que zero.`;
  if (amount > MAX_AMOUNT) return `O ${label} está acima do limite permitido.`;
  return null;
}
