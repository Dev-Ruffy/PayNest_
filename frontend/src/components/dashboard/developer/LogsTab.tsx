"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Input";
import { api } from "@/lib/axios";
import { formatDate, groupByDate } from "@/lib/utils";
import { AUDIT_ACTION_META, AUDIT_ACTION_CATEGORIES, FALLBACK_ACTION_META, TONE_ICON_BG } from "@/lib/auditActions";
import { AuditLogEntry, PaginatedResult } from "@/types";

interface FailedLogin {
  id: string;
  identifier: string;
  role: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface SchoolOption {
  id: string;
  name: string;
}

function PaginationControls({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40">
        <ChevronLeft className="h-4 w-4" />
      </button>
      Page {page} of {totalPages}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 p-1.5 disabled:opacity-40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LogsTab() {
  const [sub, setSub] = useState("audit");

  // --- Audit trail state: filters + pagination ---
  const [auditPage, setAuditPage] = useState(1);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const { data: schools } = useQuery({
    queryKey: ["developer-schools"],
    queryFn: async () => (await api.get("/developer/schools")).data.data as SchoolOption[],
    enabled: sub === "audit",
  });

  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ["developer-audit-logs", auditPage, schoolFilter, actionFilter],
    queryFn: async () =>
      (
        await api.get("/developer/audit-logs", {
          params: { page: auditPage, schoolId: schoolFilter || undefined, action: actionFilter || undefined },
        })
      ).data.data as PaginatedResult<AuditLogEntry>,
    enabled: sub === "audit",
  });

  // --- Failed logins state: pagination only ---
  const [failedPage, setFailedPage] = useState(1);

  const { data: failedLogins, isLoading: loadingFailed } = useQuery({
    queryKey: ["developer-failed-logins", failedPage],
    queryFn: async () => (await api.get("/developer/failed-logins", { params: { page: failedPage } })).data.data as PaginatedResult<FailedLogin>,
    enabled: sub === "failed",
  });

  const auditTotalPages = auditLogs ? Math.max(1, Math.ceil(auditLogs.total / auditLogs.pageSize)) : 1;
  const failedTotalPages = failedLogins ? Math.max(1, Math.ceil(failedLogins.total / failedLogins.pageSize)) : 1;
  const groupedAudit = groupByDate(auditLogs?.items ?? []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>System logs</CardTitle>
        {sub === "audit" && <PaginationControls page={auditPage} totalPages={auditTotalPages} onChange={setAuditPage} />}
        {sub === "failed" && <PaginationControls page={failedPage} totalPages={failedTotalPages} onChange={setFailedPage} />}
      </CardHeader>
      <div className="px-6">
        <Tabs
          tabs={[
            { id: "audit", label: "Audit trail" },
            { id: "failed", label: "Failed logins" },
          ]}
          active={sub}
          onChange={(id) => {
            setSub(id);
          }}
        />
      </div>
      <CardContent>
        {sub === "audit" && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Filter className="h-3.5 w-3.5" /> Filter
              </div>
              <Select
                className="w-auto min-w-[10rem]"
                value={schoolFilter}
                onChange={(e) => {
                  setSchoolFilter(e.target.value);
                  setAuditPage(1);
                }}
              >
                <option value="">All schools</option>
                {schools?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <Select
                className="w-auto min-w-[10rem]"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setAuditPage(1);
                }}
              >
                <option value="">All activity</option>
                {AUDIT_ACTION_CATEGORIES.map((group) => (
                  <optgroup key={group.category} label={group.category}>
                    {group.actions.map((action) => (
                      <option key={action} value={action}>
                        {AUDIT_ACTION_META[action]?.label ?? action}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </div>

            {loadingAudit && (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton h-14 w-full" />
                ))}
              </div>
            )}

            {!loadingAudit && groupedAudit.length === 0 && (
              <p className="py-14 text-center text-sm text-slate-400">No activity matches these filters.</p>
            )}

            {!loadingAudit &&
              groupedAudit.map((group) => (
                <div key={group.label} className="mb-6 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((log) => {
                      const meta = AUDIT_ACTION_META[log.action] ?? FALLBACK_ACTION_META;
                      const Icon = meta.icon;
                      return (
                        <div key={log.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_ICON_BG[meta.tone]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-medium text-ink">{meta.label}</span>
                              {log.school?.name && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                                  {log.school.name}
                                </span>
                              )}
                            </div>
                            {log.detail && <p className="mt-0.5 text-sm text-slate-500">{log.detail}</p>}
                            <p className="mt-1 text-xs text-slate-400">
                              {log.actor ? `${log.actor.fullName} (${log.actor.role})` : "System"} ·{" "}
                              {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(log.createdAt))}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </>
        )}

        {sub === "failed" && (
          <Table
            isLoading={loadingFailed}
            data={failedLogins?.items ?? []}
            keyExtractor={(row) => row.id}
            emptyLabel="No failed login attempts recorded."
            columns={[
              { header: "Identifier", accessor: (l) => l.identifier },
              { header: "Role", accessor: (l) => l.role ?? "—" },
              { header: "IP", accessor: (l) => <span className="font-mono text-xs">{l.ipAddress ?? "—"}</span> },
              { header: "When", accessor: (l) => formatDate(l.createdAt) },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
