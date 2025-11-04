import { MetricCard } from '../metric-card';
import { Package } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard
        title="Total Products"
        value="24"
        icon={Package}
        trend={{ value: "+2 from last week", positive: true }}
      />
      <MetricCard
        title="Stock Value"
        value="$12,450"
        icon={Package}
      />
    </div>
  );
}
