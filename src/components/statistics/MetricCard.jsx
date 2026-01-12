function MetricCard({ icon: Icon, value, label, trend }) {
  return (
    <div className="card hover:scale-105 transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {Icon && (
              <div className="p-2 bg-eco-primary-100 rounded-lg">
                <Icon className="w-6 h-6 text-eco-primary-600" />
              </div>
            )}
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {label}
            </p>
          </div>
          <p className="text-4xl font-bold text-eco-primary-600 mb-2">
            {value}
          </p>
          {trend && (
            <p className="text-sm text-gray-500">
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
