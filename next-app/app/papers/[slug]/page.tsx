import { notFound } from "next/navigation"

import { PaperArticlePage } from "@/components/home/paper-article-page"
import {
  getPublicPaper,
  getPublicPaperBody,
  getRelatedPublicPapers,
  listPublicPapers,
} from "@/lib/boreal/papers"

export function generateStaticParams() {
  return listPublicPapers().map((paper) => ({
    slug: paper.slug,
  }))
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
      body={body}
      paper={paper}
      relatedPapers={getRelatedPublicPapers(slug)}
    />
  )
}
