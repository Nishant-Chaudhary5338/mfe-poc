import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, CardContent, CardHeader, CardTitle, DataTable, Progress, Skeleton } from '@repo/ui';
import { useGetAssetsQuery, useGetJobsQuery, type Asset, type Job } from '../store/api';

const statusVariant = (s: string) =>
  s === 'ready' ? 'default' : s === 'processing' ? 'secondary' : 'destructive';

const jobStatusVariant = (s: string) =>
  s === 'completed' ? 'default' : s === 'running' ? 'secondary' : s === 'queued' ? 'outline' : 'destructive';

function fmtSize(bytes: number) {
  if (!bytes) return '—';
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

const assetColumns: ColumnDef<Asset>[] = [
  { accessorKey: 'name',       header: 'File Name',   size: 220 },
  { accessorKey: 'type',       header: 'Type',        cell: ({ getValue }) => <Badge variant="outline" className="uppercase text-xs">{getValue() as string}</Badge> },
  { accessorKey: 'size',       header: 'Size',        cell: ({ getValue }) => fmtSize(getValue() as number) },
  { accessorKey: 'uploadedBy', header: 'Uploaded By' },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={statusVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
];

const jobColumns: ColumnDef<Job>[] = [
  { accessorKey: 'asset',  header: 'Asset',   size: 200 },
  { accessorKey: 'preset', header: 'Preset' },
  {
    accessorKey: 'progress', header: 'Progress',
    cell: ({ getValue, row }) => {
      const p = getValue() as number;
      const s = row.original.status;
      if (s === 'queued') return <span className="text-xs text-slate-400">Queued</span>;
      return (
        <div className="flex items-center gap-2">
          <Progress value={p} className="h-1.5 w-24" />
          <span className="text-xs text-slate-500">{p}%</span>
        </div>
      );
    },
  },
  { accessorKey: 'duration', header: 'Duration', cell: ({ getValue }) => getValue() ? `${getValue()}s` : '—' },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={jobStatusVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
];

export default function Dashboard() {
  const { data: assets = [], isLoading: assetsLoading } = useGetAssetsQuery();
  const { data: jobs   = [], isLoading: jobsLoading   } = useGetJobsQuery();

  const ready      = assets.filter(a => a.status === 'ready').length;
  const processing = assets.filter(a => a.status === 'processing').length;
  const running    = jobs.filter(j => j.status === 'running').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Sora] text-2xl font-bold text-slate-900">Asset Library</h1>
        <p className="mt-1 text-sm text-slate-500">Media assets and transcoding pipeline</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {assetsLoading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
        )) : (
          <>
            <StatCard label="Total Assets"  value={assets.length} color="text-slate-900" />
            <StatCard label="Ready"         value={ready}         color="text-green-600" />
            <StatCard label="Processing"    value={processing}    color="text-amber-600" />
            <StatCard label="Active Jobs"   value={running}       color="text-[#F4511E]" />
          </>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Assets</CardTitle></CardHeader>
        <CardContent>
          {assetsLoading
            ? <Skeleton className="h-48 w-full" />
            : <DataTable columns={assetColumns} data={assets} features={{ sorting: true, globalFilter: true, hoverable: true, striped: true }} />
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Transcoding Jobs</CardTitle>
          {running > 0 && <Badge variant="secondary">{running} running</Badge>}
        </CardHeader>
        <CardContent>
          {jobsLoading
            ? <Skeleton className="h-32 w-full" />
            : <DataTable columns={jobColumns} data={jobs} features={{ sorting: true, hoverable: true }} />
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
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className={`mt-1 font-[Sora] text-3xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
