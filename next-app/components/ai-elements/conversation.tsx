"use client"

import GradualBlur from "@/components/GradualBlur"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"
import { ArrowDownIcon, DownloadIcon } from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import {
  StickToBottom,
  useStickToBottomContext,
  type StickToBottomContext,
} from "use-stick-to-bottom"

export type ConversationProps = ComponentProps<typeof StickToBottom>
type ConversationRenderChildren = Extract<
  ConversationProps["children"],
  (context: StickToBottomContext) => ReactNode
>

export const Conversation = ({
  className,
  children,
  ...props
}: ConversationProps) => {
  let content: ConversationProps["children"]

  if (typeof children === "function") {
    const renderChildren = children as ConversationRenderChildren
    content = function renderConversationChildren(
      context: StickToBottomContext
    ) {
      return (
        <>
          {renderChildren(context)}
          <ConversationBlurOverlays />
        </>
      )
    }
  } else {
    content = (
      <>
        {children}
        <ConversationBlurOverlays />
      </>
    )
  }

  return (
    <StickToBottom
      className={cn("relative flex-1 overflow-y-hidden", className)}
      initial="smooth"
      resize="smooth"
      role="log"
      {...props}
    >
      {content}
    </StickToBottom>
  )
}

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content
    className={cn("flex flex-col gap-8 p-4", className)}
    {...props}
  />
)

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </>
    )}
  </div>
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(() => {
    scrollToBottom()
  }, [scrollToBottom])

  return (
    !isAtBottom && (
      <Button
        className={cn(
          "absolute bottom-4 left-[50%] z-[3] translate-x-[-50%] rounded-full bg-background/90 backdrop-blur-sm hover:bg-muted",
          className
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  )
}

const ConversationBlurOverlays = () => {
  const { contentRef, isAtBottom, scrollRef } = useStickToBottomContext()
  const [showTopBlur, setShowTopBlur] = useState(false)
  const [showBottomBlur, setShowBottomBlur] = useState(false)

  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) {
      return
    }

    const updateBlurState = () => {
      const scrollTop = viewport.scrollTop
      const hasOverflow = viewport.scrollHeight - viewport.clientHeight > 1

      setShowTopBlur(scrollTop > 1)
      setShowBottomBlur(hasOverflow && !isAtBottom)
    }

    updateBlurState()

    const resizeObserver = new ResizeObserver(updateBlurState)
    resizeObserver.observe(viewport)

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    viewport.addEventListener("scroll", updateBlurState, { passive: true })
    window.addEventListener("resize", updateBlurState)

    return () => {
      resizeObserver.disconnect()
      viewport.removeEventListener("scroll", updateBlurState)
      window.removeEventListener("resize", updateBlurState)
    }
  }, [contentRef, isAtBottom, scrollRef])

  return (
    <>
      {showTopBlur ? (
        <GradualBlur
          className="rounded-t-[inherit]"
          divCount={3}
          height="3rem"
          opacity={1}
          position="top"
          strength={2}
          zIndex={2}
        />
      ) : null}
      {showBottomBlur ? (
        <GradualBlur
          className="rounded-b-[inherit]"
          divCount={3}
          height="3rem"
          opacity={1}
          position="bottom"
          strength={2}
          zIndex={2}
        />
      ) : null}
    </>
  )
}

const getMessageText = (message: UIMessage): string =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")

export type ConversationDownloadProps = Omit<
  ComponentProps<typeof Button>,
  "onClick"
> & {
  messages: UIMessage[]
  filename?: string
  formatMessage?: (message: UIMessage, index: number) => string
}

const defaultFormatMessage = (message: UIMessage): string => {
  const roleLabel = message.role.charAt(0).toUpperCase() + message.role.slice(1)
  return `**${roleLabel}:** ${getMessageText(message)}`
}

export const messagesToMarkdown = (
  messages: UIMessage[],
  formatMessage: (
    message: UIMessage,
    index: number
  ) => string = defaultFormatMessage
): string => messages.map((msg, i) => formatMessage(msg, i)).join("\n\n")

export const ConversationDownload = ({
  messages,
  filename = "conversation.md",
  formatMessage = defaultFormatMessage,
  className,
  children,
  ...props
}: ConversationDownloadProps) => {
  const handleDownload = useCallback(() => {
    const markdown = messagesToMarkdown(messages, formatMessage)
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [messages, filename, formatMessage])

  return (
    <Button
      className={cn(
        "absolute top-4 right-4 rounded-full bg-background/90 backdrop-blur-sm hover:bg-muted",
        className
      )}
      onClick={handleDownload}
      size="icon"
      type="button"
      variant="outline"
      {...props}
    >
      {children ?? <DownloadIcon className="size-4" />}
    </Button>
  )
}
