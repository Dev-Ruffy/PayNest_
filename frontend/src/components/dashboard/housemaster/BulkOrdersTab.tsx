"use client";

import { useState } from "react";
import { BatchList } from "./BatchList";
import { BatchBuilder } from "./BatchBuilder";
import { BatchResultView } from "./BatchResultView";

type View =
  | { mode: "list" }
  | { mode: "builder"; batchId: string }
  | { mode: "result"; batchId: string; justConfirmed: boolean };

export function BulkOrdersTab() {
  const [view, setView] = useState<View>({ mode: "list" });

  if (view.mode === "builder") {
    return (
      <BatchBuilder
        batchId={view.batchId}
        onBack={() => setView({ mode: "list" })}
        onConfirmed={(batchId) => setView({ mode: "result", batchId, justConfirmed: true })}
      />
    );
  }

  if (view.mode === "result") {
    return (
      <BatchResultView
        batchId={view.batchId}
        justConfirmed={view.justConfirmed}
        onBack={() => setView({ mode: "list" })}
        onOpenDraft={(id) => setView({ mode: "builder", batchId: id })}
      />
    );
  }

  return (
    <BatchList
      onOpen={(batch) =>
        batch.status === "DRAFT"
          ? setView({ mode: "builder", batchId: batch.id })
          : setView({ mode: "result", batchId: batch.id, justConfirmed: false })
      }
    />
  );
}
