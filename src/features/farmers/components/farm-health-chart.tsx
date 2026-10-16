"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FarmConditionsSnapshot } from "@/types/domain";

export function FarmHealthChart({
  snapshot,
  vegetationLabel,
  rainfallLabel,
  observedLabel,
  normalLabel,
  ndviUnit,
  rainfallUnit,
  accessibleLabel,
}: {
  snapshot: FarmConditionsSnapshot;
  vegetationLabel: string;
  rainfallLabel: string;
  observedLabel: string;
  normalLabel: string;
  ndviUnit: string;
  rainfallUnit: string;
  accessibleLabel: string;
}) {
  const normalNdvi = snapshot.ndviNormal ?? snapshot.ndvi ?? 0;
  const normalRainfall = snapshot.rainfallNormalMm ?? snapshot.rainfallMm ?? 0;
  const metrics = [
    {
      name: vegetationLabel,
      observed: normalNdvi > 0 ? ((snapshot.ndvi ?? normalNdvi) / normalNdvi) * 100 : 0,
      normal: 100,
      currentValue: snapshot.ndvi ?? 0,
      normalValue: normalNdvi,
      unit: ndviUnit,
    },
    {
      name: rainfallLabel,
      observed: normalRainfall > 0 ? ((snapshot.rainfallMm ?? normalRainfall) / normalRainfall) * 100 : 0,
      normal: 100,
      currentValue: snapshot.rainfallMm ?? 0,
      normalValue: normalRainfall,
      unit: rainfallUnit,
    },
  ];

  return (
    <>
      <div className="mt-4 h-52 w-full" role="img" aria-label={accessibleLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
            <YAxis unit="%" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="observed" name={observedLabel} fill="#166534" />
            <Bar dataKey="normal" name={normalLabel} fill="#b45309" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{accessibleLabel}</caption>
        <thead><tr><th>{vegetationLabel} / {rainfallLabel}</th><th>{observedLabel}</th><th>{normalLabel}</th></tr></thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.name}>
              <td>{metric.name}</td>
              <td>{metric.currentValue} {metric.unit}</td>
              <td>{metric.normalValue} {metric.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
