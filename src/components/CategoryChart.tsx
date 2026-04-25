/**
 * Gráfico de despesas por categoria
 */

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { CategorySummary } from "../types";
import { CATEGORY_COLORS, ALL_CATEGORIES } from "../constants/categories";
import { formatCurrency } from "../utils/formatters";

interface ChartEntry {
  name: string;
  value: number;
  categoryKey: string;
}

interface CategoryChartProps {
  data: CategorySummary[];
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <p>Nenhuma despesa registrada para este período</p>
      </div>
    );
  }

  const chartData: ChartEntry[] = data.map((item) => ({
    name: ALL_CATEGORIES[item.category],
    value: item.total,
    categoryKey: item.category,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="label">{payload[0].name}</p>
          <p className="value">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="category-chart">
      <h3>Despesas por Categoria</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry: ChartEntry, index: number) => {
              const colorKey =
                entry.categoryKey as keyof typeof CATEGORY_COLORS;
              const color = (CATEGORY_COLORS[colorKey] as string) || "#9ca3af";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
