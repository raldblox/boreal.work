import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PaperArticlePage } from "@/components/home/paper-article-page"
import {
  getPublicPaper,
  getPublicPaperBody,
  getRelatedPublicPapers,
  listPublicPapers,
} from "@/lib/boreal/papers"
import { buildPageMetadata } from "@/lib/boreal/site-metadata"

export function generateStaticParams() {
  return listPublicPapers().map((paper) => ({
    slug: paper.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const paper = getPublicPaper(slug)

  if (!paper) {
    return buildPageMetadata({
      description: "The requested Boreal paper was not found.",
      noIndex: true,
      path: `/papers/${slug}`,
      title: "Paper not found",
    })
  }

  return {
    ...buildPageMetadata({
      description: paper.summary,
      keywords: [paper.kind, paper.slug, "Boreal papers", paper.audience],
      path: `/papers/${slug}`,
      title: paper.title,
      type: "article",
    }),
    openGraph: {
      description: paper.summary,
      locale: "en_US",
      modifiedTime: new Date(`${paper.updatedAt}T00:00:00.000Z`).toISOString(),
      siteName: "Boreal",
      title: paper.title,
      type: "article",
      url: `/papers/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      description: paper.summary,
      images: [`/papers/${slug}/opengraph-image`],
      title: paper.title,
    },
  }
}

export default async function PaperPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const paper = getPublicPaper(slug)

  if (!paper) {
    notFound()
  }

  const body = await getPublicPaperBody(slug)

  if (!body) {
    notFound()
  }

  return (
    <PaperArticlePage
      allPapers={listPublicPapers()}
      body={body}
      paper={paper}
      relatedPapers={getRelatedPublicPapers(slug)}
    />
  )
}
