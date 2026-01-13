import { useState } from 'react';
import { Package, Scale, Cloud, TrendingUp } from 'lucide-react';
import MetricCard from './MetricCard';
import YearlyChart from './YearlyChart';
import LoadingSpinner from '../common/LoadingSpinner';

// Real data from 2025-2026 ReUSE Store checkout records
// Weight calculations based on detailed item analysis from CSV data
const mockYearlyData = [
  { year: '2021', totalItems: 450, totalWeight: 2200, co2Saved: 1850 },
  { year: '2022', totalItems: 680, totalWeight: 3400, co2Saved: 2900 },
  { year: '2023', totalItems: 920, totalWeight: 4600, co2Saved: 3920 },
  { year: '2024', totalItems: 1240, totalWeight: 6200, co2Saved: 5280 },
  {
    year: '2025-26',
    totalItems: 3290, // From detailed checkout records
    totalWeight: 12559, // Calculated from item-by-item weight analysis
    co2Saved: 10675 // Estimated at 0.85 lbs CO2 per lb of waste diverted
  },
];

function StatsDashboard() {
  const [isLoading] = useState(false);
  const [data] = useState(mockYearlyData);

  // Calculate totals
  const totalItems = data.reduce((sum, year) => sum + year.totalItems, 0);
  const totalWeight = data.reduce((sum, year) => sum + year.totalWeight, 0);
  const totalCO2 = data.reduce((sum, year) => sum + year.co2Saved, 0);

  // Calculate growth
  const itemsGrowth = data.length > 1
    ? Math.round(((data[data.length - 1].totalItems - data[0].totalItems) / data[0].totalItems) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" text="Loading statistics..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-block p-4 bg-eco-primary-100 rounded-full mb-4">
          <TrendingUp className="w-12 h-12 text-eco-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-eco-primary-800 mb-3 font-display">
          Our Environmental Impact
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See the incredible impact we've made together from 2021 to 2026
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <MetricCard
          icon={Package}
          value={totalItems.toLocaleString()}
          label="Total Items Donated"
          trend={`${itemsGrowth}% growth since 2021`}
        />
        <MetricCard
          icon={Scale}
          value={`${totalWeight.toLocaleString()} lbs`}
          label="Weight Diverted from Landfills"
          trend="Equivalent to 3+ tons"
        />
        <MetricCard
          icon={Cloud}
          value={`${totalCO2.toLocaleString()} lbs`}
          label="CO₂ Emissions Saved"
          trend="Environmental impact"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <YearlyChart
          data={data}
          type="line"
          title="4-Year Trend: Items & Weight"
        />
        <YearlyChart
          data={data}
          type="bar"
          title="Year-over-Year Comparison"
        />
      </div>

      {/* CO2 Savings Chart */}
      <div className="card">
        <h3 className="text-2xl font-bold text-eco-primary-800 mb-6">
          CO₂ Emissions Saved Over Time
        </h3>
        <div className="h-64 flex items-end justify-around gap-4">
          {data.map((year) => (
            <div key={year.year} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-eco-primary-500 to-eco-primary-300 rounded-t-lg transition-all hover:from-eco-primary-600 hover:to-eco-primary-400"
                style={{
                  height: `${(year.co2Saved / Math.max(...data.map(d => d.co2Saved))) * 100}%`,
                  minHeight: '40px'
                }}
              >
                <div className="text-center pt-2">
                  <p className="text-white font-bold text-sm">
                    {year.co2Saved.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-gray-700 font-semibold">{year.year}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Statement */}
      <div className="card bg-gradient-to-br from-eco-primary-50 to-eco-sky-light/20 border-2 border-eco-primary-300">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-eco-primary-800 mb-4">
            What This Means
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <p className="text-5xl mb-2">🌳</p>
              <p className="text-3xl font-bold text-eco-primary-600 mb-2">
                {Math.round(totalCO2 / 50)}
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                Trees' worth of CO₂ absorbed
              </p>
            </div>
            <div className="p-4">
              <p className="text-5xl mb-2">🚗</p>
              <p className="text-3xl font-bold text-eco-primary-600 mb-2">
                {Math.round(totalCO2 / 0.404)}
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                Miles not driven
              </p>
            </div>
            <div className="p-4">
              <p className="text-5xl mb-2">💡</p>
              <p className="text-3xl font-bold text-eco-primary-600 mb-2">
                {Math.round(totalWeight / 10)}
              </p>
              <p className="text-sm text-gray-700 font-semibold">
                Households' waste for a month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Note about editing */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Note: Statistics can be updated by authorized administrators.
        </p>
      </div>
    </div>
  );
}

export default StatsDashboard;
