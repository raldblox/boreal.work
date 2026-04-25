"use client"

import type { Dispatch, ReactNode, SetStateAction } from "react"
import {
  CheckIcon,
  FileIcon,
  LoaderIcon,
  PackageIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ProposalDraft } from "@/lib/boreal/schemas/proposal"

export type DeliveryAttachmentDraft = {
  fileName: string
  fileSize: number
  id: string
  mediaType: string
  progress: number
  status: "error" | "uploaded" | "uploading"
  storageId: string | null
}

export type DeliveryDraft = {
  attachments: DeliveryAttachmentDraft[]
  deliverablesBody: string
}

type ProposalSubmissionDialogProps = {
  canSubmit: boolean
  isDraftingProposal: boolean
  isOpen: boolean
  isSubmittingProposal: boolean
  onDraftProposal: () => Promise<void>
  onOpenChange: (open: boolean) => void
  onReset: () => void
  onSubmitProposal: () => Promise<void>
  preview: ReactNode
  proposalDraft: ProposalDraft
  proposalMessage: string
  setProposalDraft: Dispatch<SetStateAction<ProposalDraft>>
  setProposalMessage: Dispatch<SetStateAction<string>>
}

type DeliverySubmissionDialogProps = {
  canSubmit: boolean
  deliveryDraft: DeliveryDraft
  isOpen: boolean
  isSubmittingDelivery: boolean
  isUploadingDeliveryFiles: boolean
  onOpenChange: (open: boolean) => void
  onRemoveAttachment: (attachmentId: string) => void
  onReset: () => void
  onSelectFiles: (files: File[]) => Promise<void>
  onSubmitDelivery: () => Promise<void>
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>
}

export function ProposalSubmissionDialog({
  canSubmit,
  isDraftingProposal,
  isOpen,
  isSubmittingProposal,
  onDraftProposal,
  onOpenChange,
  onReset,
  onSubmitProposal,
  preview,
  proposalDraft,
  proposalMessage,
  setProposalDraft,
  setProposalMessage,
}: ProposalSubmissionDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-[min(56rem,calc(100vw-2rem))] p-0 sm:max-w-[min(56rem,calc(100vw-2rem))]">
        <div className="flex max-h-[88svh] min-h-[68svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Proposal Submission</DialogTitle>
            <DialogDescription>
              Shape the proposal here. Improve uses Boreal to refine the draft.
              Send now submits exactly what is in the form.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              <label className="space-y-2">
                <FieldLabel>Source description</FieldLabel>
                <Textarea
                  className="min-h-32 rounded-xl px-3 py-3 text-sm"
                  onChange={(event) => setProposalMessage(event.target.value)}
                  placeholder="Describe how you would handle this request. Boreal only uses this when you choose Improve proposal."
                  value={proposalMessage}
                />
              </label>
              <ProposalDraftFields
                proposalDraft={proposalDraft}
                setProposalDraft={setProposalDraft}
              />
              <div className="space-y-2 rounded-xl border border-border bg-card/80 p-4">
                <p className="text-sm font-medium">Preview</p>
                {preview}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button onClick={onReset} size="sm" type="button" variant="ghost">
              Reset
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  isDraftingProposal || proposalMessage.trim().length === 0
                }
                onClick={() => void onDraftProposal()}
                size="sm"
                type="button"
                variant="outline"
              >
                {isDraftingProposal ? (
                  <LoaderIcon className="animate-spin" />
                ) : (
                  <SparklesIcon />
                )}
                Improve Proposal
              </Button>
              <Button
                disabled={isSubmittingProposal || !canSubmit}
                onClick={() => void onSubmitProposal()}
                size="sm"
                type="button"
              >
                {isSubmittingProposal ? (
                  <LoaderIcon className="animate-spin" />
                ) : (
                  <CheckIcon />
                )}
                Send Now
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProposalDraftFields({
  proposalDraft,
  setProposalDraft,
}: {
  proposalDraft: ProposalDraft
  setProposalDraft: Dispatch<SetStateAction<ProposalDraft>>
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="space-y-2">
        <FieldLabel>Summary</FieldLabel>
        <Input
          className="h-10"
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              summary: event.target.value,
            }))
          }
          placeholder="Short summary of your offer"
          value={proposalDraft.summary ?? ""}
        />
      </label>
      <SelectField
        label="Deliverable type"
        onValueChange={(value) =>
          setProposalDraft((current) => ({
            ...current,
            deliverablesType:
              value === "file" || value === "link" ? value : "markdown",
          }))
        }
        options={[
          { label: "Markdown", value: "markdown" },
          { label: "File", value: "file" },
          { label: "Link", value: "link" },
        ]}
        value={proposalDraft.deliverablesType ?? "markdown"}
      />
      <label className="space-y-2 md:col-span-2">
        <FieldLabel>Deliverables</FieldLabel>
        <Textarea
          className="min-h-32 rounded-xl px-3 py-3 text-sm"
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              deliverablesBody: event.target.value,
            }))
          }
          placeholder="Describe exactly what will be delivered"
          value={proposalDraft.deliverablesBody ?? ""}
        />
      </label>
      <label className="space-y-2">
        <FieldLabel>Quote</FieldLabel>
        <Input
          className="h-10"
          inputMode="decimal"
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              price: Number.parseFloat(event.target.value) || 0,
            }))
          }
          placeholder="100"
          type="number"
          value={proposalDraft.price > 0 ? proposalDraft.price : ""}
        />
      </label>
      <label className="space-y-2">
        <FieldLabel>Currency</FieldLabel>
        <Input
          className="h-10"
          maxLength={6}
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              currency: event.target.value.trim().toUpperCase(),
            }))
          }
          placeholder="USD"
          value={proposalDraft.currency ?? ""}
        />
      </label>
      <label className="space-y-2">
        <FieldLabel>ETA in days</FieldLabel>
        <Input
          className="h-10"
          inputMode="numeric"
          min={1}
          onChange={(event) =>
            setProposalDraft((current) => ({
              ...current,
              etaDays: Number.parseInt(event.target.value, 10) || 0,
            }))
          }
          placeholder="7"
          type="number"
          value={proposalDraft.etaDays > 0 ? proposalDraft.etaDays : ""}
        />
      </label>
    </div>
  )
}

export function DeliverySubmissionDialog({
  canSubmit,
  deliveryDraft,
  isOpen,
  isSubmittingDelivery,
  isUploadingDeliveryFiles,
  onOpenChange,
  onRemoveAttachment,
  onReset,
  onSelectFiles,
  onSubmitDelivery,
  setDeliveryDraft,
}: DeliverySubmissionDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={isOpen}>
      <DialogContent className="max-w-[min(56rem,calc(100vw-2rem))] p-0 sm:max-w-[min(56rem,calc(100vw-2rem))]">
        <div className="flex max-h-[88svh] min-h-[68svh] flex-col overflow-hidden">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Work Submission</DialogTitle>
            <DialogDescription>
              Prepare the final delivery here. Files upload immediately, and
              send stays locked until every attachment is uploaded.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <DeliveryDraftFields
              deliveryDraft={deliveryDraft}
              onRemoveAttachment={onRemoveAttachment}
              onSelectFiles={onSelectFiles}
              setDeliveryDraft={setDeliveryDraft}
            />
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button onClick={onReset} size="sm" type="button" variant="ghost">
              Reset
            </Button>
            <Button
              disabled={
                isSubmittingDelivery || isUploadingDeliveryFiles || !canSubmit
              }
              onClick={() => void onSubmitDelivery()}
              size="sm"
              type="button"
            >
              {isSubmittingDelivery ? (
                <LoaderIcon className="animate-spin" />
              ) : (
                <PackageIcon />
              )}
              {isUploadingDeliveryFiles ? "Uploading files..." : "Send Work"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DeliveryDraftFields({
  deliveryDraft,
  onRemoveAttachment,
  onSelectFiles,
  setDeliveryDraft,
}: {
  deliveryDraft: DeliveryDraft
  onRemoveAttachment: (attachmentId: string) => void
  onSelectFiles: (files: File[]) => Promise<void>
  setDeliveryDraft: Dispatch<SetStateAction<DeliveryDraft>>
}) {
  return (
    <div className="space-y-4">
      <label className="space-y-2">
        <FieldLabel>Body message</FieldLabel>
        <Textarea
          className="min-h-48 rounded-xl px-3 py-3 text-sm"
          onChange={(event) =>
            setDeliveryDraft((current) => ({
              ...current,
              deliverablesBody: event.target.value,
            }))
          }
          placeholder="Submit the completed work, result link, or markdown deliverable."
          value={deliveryDraft.deliverablesBody}
        />
      </label>
      <label className="space-y-2">
        <FieldLabel>Attach files</FieldLabel>
        <Input
          className="h-auto px-3 py-2 text-sm file:mr-3"
          multiple
          onChange={(event) => {
            const files = Array.from(event.target.files ?? [])
            event.currentTarget.value = ""
            void onSelectFiles(files)
          }}
          type="file"
        />
      </label>
      {deliveryDraft.attachments.length > 0 ? (
        <div className="space-y-3">
          {deliveryDraft.attachments.map((attachment) => (
            <div
              className="space-y-2 rounded-xl border border-border p-3"
              key={attachment.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground">
                    <FileIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {attachment.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {attachment.status === "uploaded"
                      ? "Uploaded"
                      : attachment.status === "error"
                        ? "Failed"
                        : `${attachment.progress}%`}
                  </span>
                  <Button
                    onClick={() => onRemoveAttachment(attachment.id)}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
              <Progress value={attachment.progress} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

function SelectField({
  label,
  onValueChange,
  options,
  value,
}: {
  label: string
  onValueChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  value: string
}) {
  return (
    <label className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger className="h-10 w-full text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  )
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${size} B`
}
