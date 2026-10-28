"use client";

import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useActionForm } from "@/hooks/use-action-form";
import { deleteVerificationDocument, uploadVerificationDocument } from "@/lib/actions/technician";

type Document = { id: string; documentType: string; fileName: string | null; url: string; uploadedAt: string };

export function DocumentsPanel({
  documents,
  kinds,
  locked,
}: {
  documents: Document[];
  kinds: string[];
  locked: boolean;
}) {
  const [state, action, pending] = useActionForm(uploadVerificationDocument, {});

  return (
    <Panel>
      <PanelHeader
        title="Verification documents"
        description="Upload ID and trade proofs (JPG, PNG, WebP or PDF, up to 5 MB). Admins review them before approving you."
      />
      {documents.length > 0 ? (
        <ul className="mb-5 divide-y rounded-xl border">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>
                <span className="font-medium">{d.documentType}</span>
                <span className="text-muted-foreground"> · {d.fileName ?? "file"} · {d.uploadedAt}</span>
              </span>
              <span className="flex items-center gap-2">
                <a href={d.url} target="_blank" rel="noreferrer" className="text-primary underline">
                  View
                </a>
                {!locked ? (
                  <ActionButton
                    action={deleteVerificationDocument.bind(null, d.id)}
                    variant="ghost"
                    size="sm"
                    confirmMessage="Remove this document?"
                  >
                    Remove
                  </ActionButton>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">No documents uploaded yet.</p>
      )}

      <form onSubmit={action} className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="documentType">Document type</Label>
          <NativeSelect id="documentType" name="documentType" defaultValue={kinds[0]}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">File</Label>
          <Input
            id="document"
            name="document"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="rounded-lg"
          />
        </div>
        <Button type="submit" disabled={pending} className="rounded-lg">
          {pending ? "Uploading…" : "Upload"}
        </Button>
        {state.error ? <p className="text-sm text-destructive sm:col-span-3">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-primary sm:col-span-3">{state.success}</p> : null}
      </form>
    </Panel>
  );
}
