import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, CardContent, CardHeader, CardTitle, DataTable, Skeleton } from '@repo/ui';
import { useGetChecksQuery, useGetRulesQuery, type Check, type Rule } from '../store/api';

const statusVariant = (s: string) =>
  s === 'passed' ? 'default' : s === 'warning' ? 'secondary' : 'destructive';

const severityVariant = (s: string) =>
  s === 'critical' ? 'destructive' : s === 'high' ? 'secondary' : 'default';

const checkColumns: ColumnDef<Check>[] = [
  { accessorKey: 'asset',    header: 'Asset',    size: 200 },
  { accessorKey: 'rule',     header: 'Rule',     size: 180 },
  { accessorKey: 'operator', header: 'Operator' },
  { accessorKey: 'score',    header: 'Score',    cell: ({ getValue }) => `${getValue()}/100` },
  { accessorKey: 'runAt',    header: 'Run At',   cell: ({ getValue }) => new Date(getValue() as string).toLocaleString() },
  {
    accessorKey: 'status', header: 'Result',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={statusVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
];

const ruleColumns: ColumnDef<Rule>[] = [
  { accessorKey: 'name',      header: 'Rule Name',  size: 200 },
  { accessorKey: 'type',      header: 'Asset Type' },
  { accessorKey: 'threshold', header: 'Threshold' },
  {
    accessorKey: 'severity', header: 'Severity',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={severityVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
  {
    accessorKey: 'active', header: 'Active',
    cell: ({ getValue }) => {
      const active = getValue() as boolean;
      return <Badge variant={active ? 'default' : 'secondary'}>{active ? 'Active' : 'Disabled'}</Badge>;
    },
  },
];

export default function Dashboard() {
  const { data: checks = [], isLoading: checksLoading } = useGetChecksQuery();
  const { data: rules  = [], isLoading: rulesLoading  } = useGetRulesQuery();

  const passed  = checks.filter(c => c.status === 'passed').length;
  const failed  = checks.filter(c => c.status === 'failed').length;
  const warning = checks.filter(c => c.status === 'warning').length;
  const avgScore = checks.length ? Math.round(checks.reduce((a, c) => a + c.score, 0) / checks.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Sora] text-2xl font-bold text-slate-900">QC Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Quality check results and active rule configuration</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {checksLoading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
        )) : (
          <>
            <StatCard label="Total Checks" value={checks.length} color="text-slate-900" />
            <StatCard label="Passed"       value={passed}        color="text-green-600" />
            <StatCard label="Failed"       value={failed}        color="text-red-600" />
            <StatCard label="Avg Score"    value={avgScore}      color="text-[#546BE8]" suffix="/100" />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Checks</CardTitle>
          {warning > 0 && <Badge variant="secondary">{warning} warnings</Badge>}
        </CardHeader>
        <CardContent>
          {checksLoading
            ? <Skeleton className="h-48 w-full" />
            : <DataTable columns={checkColumns} data={checks} features={{ sorting: true, globalFilter: true, hoverable: true, striped: true }} />
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rulesLoading
            ? <Skeleton className="h-32 w-full" />
            : <DataTable columns={ruleColumns} data={rules} features={{ sorting: true, hoverable: true }} />
          }
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color, suffix = '' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`mt-1 font-[Sora] text-3xl font-bold ${color}`}>{value}{suffix}</p>
      </CardContent>
    </Card>
  );
}
