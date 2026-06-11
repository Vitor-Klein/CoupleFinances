import React from 'react';
import { parseCurrencyDigits, formatCurrencyInput } from '../utils/currency';

interface CurrencyInputProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Input de moeda estilo app de banco: digita-se os centavos e o valor
 * cresce da direita para a esquerda ("1" → 0,01 → "12" → 0,12 → "123" → 1,23).
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  value,
  onChange,
  placeholder = '0,00',
  autoFocus,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseCurrencyDigits(e.target.value));
  };

  return (
    <div className={`currency-input ${className ?? ''}`}>
      <span className="currency-input-prefix">R$</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className="form-input currency-input-field"
        placeholder={placeholder}
        value={formatCurrencyInput(value)}
        onChange={handleChange}
        autoFocus={autoFocus}
      />
    </div>
  );
};
