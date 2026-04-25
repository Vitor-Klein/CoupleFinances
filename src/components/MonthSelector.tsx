/**
 * Seletor de mês
 */

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth } from "../utils/formatters";

interface MonthSelectorProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  year,
  month,
  onMonthChange,
}) => {
  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  return (
    <div className="month-selector">
      <button
        className="month-button"
        onClick={handlePrevious}
        title="Mês anterior"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={20} />
      </button>
      <span className="month-text">{formatMonth(year, month)}</span>
      <button
        className="month-button"
        onClick={handleNext}
        title="Próximo mês"
        aria-label="Próximo mês"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};
