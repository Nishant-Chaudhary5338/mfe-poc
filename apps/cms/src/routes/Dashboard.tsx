import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, CardContent, CardHeader, CardTitle, DataTable, Skeleton } from '@repo/ui';
import { useGetArticlesQuery, type Article } from '../store/api';

const statusVariant = (s: string) =>
  s === 'published' ? 'default' : s === 'draft' ? 'secondary' : 'outline';

const articleColumns: ColumnDef<Article>[] = [
  { accessorKey: 'title',     header: 'Title',     size: 260 },
  { accessorKey: 'author',    header: 'Author' },
  {
    accessorKey: 'tags', header: 'Tags',
    cell: ({ getValue }) => {
      const tags = getValue() as string[];
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
      );
    },
  },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
  {
    accessorKey: 'status', header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={statusVariant(s)} className="capitalize">{s}</Badge>;
    },
  },
];

export default function Dashboard() {
  const { data: articles = [], isLoading } = useGetArticlesQuery();

  const published = articles.filter(a => a.status === 'published').length;
  const draft     = articles.filter(a => a.status === 'draft').length;
  const archived  = articles.filter(a => a.status === 'archived').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[Sora] text-2xl font-bold text-slate-900">Content Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Manage articles, schedules, and channel content</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
        )) : (
          <>
            <StatCard label="Total"     value={articles.length} color="text-slate-900" />
            <StatCard label="Published" value={published}       color="text-green-600" />
            <StatCard label="Drafts"    value={draft}           color="text-amber-600" />
            <StatCard label="Archived"  value={archived}        color="text-slate-400" />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading
            ? <Skeleton className="h-48 w-full" />
            : <DataTable
                columns={articleColumns}
                data={articles}
                features={{ sorting: true, globalFilter: true, pagination: true, hoverable: true, striped: true }}
              />
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
