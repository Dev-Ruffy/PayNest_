"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/axios";
import { formatDate } from "@/lib/utils";
import { Role } from "@/types";

interface ActiveUser {
  id: string;
  fullName: string;
  role: Role;
  createdAt: string;
  school: { name: string } | null;
}

export function UsersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["developer-active-users"],
    queryFn: async () => (await api.get("/developer/active-users")).data.data as ActiveUser[],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          isLoading={isLoading}
          data={data ?? []}
          keyExtractor={(row) => row.id}
          emptyLabel="No active users yet."
          columns={[
            { header: "Name", accessor: (u) => u.fullName },
            { header: "Role", accessor: (u) => <Badge tone="gold">{u.role}</Badge> },
            { header: "School", accessor: (u) => u.school?.name ?? "— (platform)" },
            { header: "Since", accessor: (u) => formatDate(u.createdAt) },
          ]}
        />
      </CardContent>
    </Card>
  );
}
