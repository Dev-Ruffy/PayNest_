"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { AuditLogEntry, PaginatedResult } from "@/types";

export function AuditLogTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => (await api.get("/admin/audit-logs")).data.data as PaginatedResult<AuditLogEntry>,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data?.items ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No activity recorded yet."
          columns={[
            { header: "Action", accessor: (l) => <Badge tone="slate">{l.action.replaceAll("_", " ")}</Badge> },
            { header: "Detail", accessor: (l) => <span className="text-slate-500">{l.detail ?? "—"}</span> },
            { header: "By", accessor: (l) => (l.actor ? `${l.actor.fullName} (${l.actor.role})` : "System") },
            { header: "When", accessor: (l) => formatDate(l.createdAt) },
          ]}
        />
      </CardContent>
    </Card>
  );
}
