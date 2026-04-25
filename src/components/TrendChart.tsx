/**
 * Gráfico de tendência mensal
 */

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../utils/formatters";

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface TrendChartProps {
  data: TrendData[];
  type?: "line" | "bar";
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  type = "line",
}) => {
  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <p>Sem dados para exibir</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="label">{payload[0].payload.month}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="trend-chart">
      <h3>Tendência Mensal</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              name="Receitas"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              name="Despesas"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              name="Saldo"
              strokeWidth={2}
            />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Receitas" />
            <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
