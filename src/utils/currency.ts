/**
 * Máscara de moeda estilo app de banco: digita-se da direita
 * para a esquerda, sempre em centavos.
 */

/** Converte texto digitado em valor numérico (reais). "1234" → 12.34 */
export function parseCurrencyDigits(raw: string): number {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

/** Formata valor em reais para exibição no input: 12.34 → "12,34" */
export function formatCurrencyInput(value: number): string {
  if (!value) return '';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
