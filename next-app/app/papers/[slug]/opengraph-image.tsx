import { notFound } from "next/navigation"

import {
  OG_IMAGE_CONTENT_TYPE,
  OG_IMAGE_SIZE,
  createBorealOgImage,
} from "@/lib/boreal/og-image"
import {
  getPublicPaper,
  getPublicPaperSeriesMeta,
  publicPaperKindLabels,
} from "@/lib/boreal/papers-data"

export const contentType = OG_IMAGE_CONTENT_TYPE
export const size = OG_IMAGE_SIZE

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const paper = getPublicPaper(slug)

  if (!paper) {
    return []
  }

  return [
    {
      alt: `${paper.title} | Boreal Papers`,
      contentType,
      id: slug,
      size,
    },
  ]
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const paper = getPublicPaper(slug)

  if (!paper) {
    notFound()
  }

  const seriesMeta = getPublicPaperSeriesMeta(slug)

  return createBorealOgImage({
    badge: publicPaperKindLabels[paper.kind],
    description: paper.summary,
    eyebrow: "Boreal Papers",
    footer: `boreal.work/papers/${paper.slug}`,
    meta: [
      seriesMeta.stageLabel,
      paper.readingTime,
      `Updated ${paper.updatedAt}`,
    ],
    title: paper.title,
  })
}
