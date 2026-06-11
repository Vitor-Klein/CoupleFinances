/**
 * Exportação CSV (compatível com Excel pt-BR: separador ";" e BOM UTF-8)
 */

function escapeCell(cell: string): string {
  if (/[";\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function downloadCSV(filename: string, rows: string[][]): void {
  const content = '﻿' + rows.map((r) => r.map(escapeCell).join(';')).join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Número no padrão pt-BR para planilhas (1234.5 → "1234,50") */
export function csvNumber(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
