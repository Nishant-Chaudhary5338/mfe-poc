import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, CardContent, CardHeader, CardTitle, DataTable, Skeleton } from '@repo/ui';
import { useGetMetricsQuery, useGetAlertsQuery, type Metric, type Alert } from '../store/api';

const statusVariant = (s: string) =>
  s === 'healthy' ? 'default' : s === 'degraded' ? 'secondary' : 'destructive';

const severityVariant = (s: string) =>
  s === 'critical' ? 'destructive' : s === 'warning' ? 'secondary' : 'default';

const metricColumns: ColumnDef<Metric>[] = [
  { accessorKey: 'service',   header: 'Service',    size: 200 },
  { accessorKey: 'region',    header: 'Region' },
  { accessorKey: 'cpu',       header: 'CPU %',      cell: ({ getValue }) => `${getValue()}%` },
  { accessorKey: 'memory',    header: 'Memory %',   cell: ({ getValue }) => `${getValue()}%` },
  { accessorKey: 'latencyMs', header: 'Latency',    cell: ({ getValue }) => `${getValue()} ms` },
  { accessorKey: 'uptime',    header: 'Uptime',     cell: ({ getValue }) => `${getValue()}%` },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={statusVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
];

const alertColumns: ColumnDef<Alert>[] = [
  { accessorKey: 'rule',      header: 'Rule',     size: 200 },
  { accessorKey: 'service',   header: 'Service' },
  {
    accessorKey: 'severity', header: 'Severity',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={severityVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
  { accessorKey: 'firedAt', header: 'Fired At', cell: ({ getValue }) => new Date(getValue() as string).toLocaleString() },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={s === 'resolved' ? 'secondary' : 'destructive'} className="capitalize">{s}</Badge>;
    },
  },
];

export default function Dashboard() {
  const { data: metrics = [], isLoading: metricsLoading } = useGetMetricsQuery();
  const { data: alerts  = [], isLoading: alertsLoading  } = useGetAlertsQuery();

  const healthy  = metrics.filter(m => m.status === 'healthy').length;
  const degraded = metrics.filter(m => m.status === 'degraded').length;
  const critical = metrics.filter(m => m.status === 'critical').length;
  const firingAlerts = alerts.filter(a => a.status === 'firing').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Sora] text-2xl font-bold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Real-time service health across all regions</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricsLoading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
        )) : (
          <>
            <StatCard label="Total Services" value={metrics.length} color="text-slate-900" />
            <StatCard label="Healthy"         value={healthy}        color="text-green-600" />
            <StatCard label="Degraded"        value={degraded}       color="text-amber-600" />
            <StatCard label="Critical"        value={critical}       color="text-red-600" />
          </>
        )}
      </div>

      {/* Services table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Health</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsLoading
            ? <Skeleton className="h-48 w-full" />
            : <DataTable columns={metricColumns} data={metrics} features={{ sorting: true, globalFilter: true, hoverable: true, striped: true }} />
          }
        </CardContent>
      </Card>

      {/* Alerts table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Active Alerts</CardTitle>
          {firingAlerts > 0 && <Badge variant="destructive">{firingAlerts} firing</Badge>}
        </CardHeader>
        <CardContent>
          {alertsLoading
            ? <Skeleton className="h-32 w-full" />
            : <DataTable columns={alertColumns} data={alerts} features={{ sorting: true, hoverable: true }} />
          }
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`mt-1 font-[Sora] text-3xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
