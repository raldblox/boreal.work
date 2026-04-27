import { NextResponse } from "next/server"

import {
  getPublicPaper,
  getPublicPaperBody,
  getRelatedPublicPapers,
} from "@/lib/boreal/papers"

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const paper = getPublicPaper(slug)

  if (!paper) {
    return NextResponse.json({ error: "Paper not found." }, { status: 404 })
  }

  const body = await getPublicPaperBody(slug)

  if (!body) {
    return NextResponse.json(
      { error: "Paper body not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({
    body,
    paper,
    relatedPapers: getRelatedPublicPapers(slug),
  })
}
