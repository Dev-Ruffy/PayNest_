"use client";

import { useState } from "react";
import { BatchList } from "./BatchList";
import { BatchResultView } from "./BatchResultView";

/** Every bulk order at the school, from any Housemaster. Opening one shows its full results. */
export function BatchHistoryTab({ onOpenDraft }: { onOpenDraft: (batchId: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (openId) {
    return <BatchResultView batchId={openId} justConfirmed={false} onBack={() => setOpenId(null)} onOpenDraft={onOpenDraft} />;
  }

  return <BatchList mode="history" onOpen={(batch) => setOpenId(batch.id)} onDuplicated={onOpenDraft} />;
}
