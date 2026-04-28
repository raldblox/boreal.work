import { readFile } from "node:fs/promises"
import path from "node:path"

import { getPublicPaper } from "./papers-data"

export type { PublicPaperKind, PublicPaperRecord } from "./papers-data"
export {
  getPublicPaper,
  getPublicPaperHref,
  getNextPublicPaper,
  getPreviousPublicPaper,
  getRelatedPublicPapers,
  getPublicPaperSequencePosition,
  getPublicPaperSeriesMeta,
  getTotalPublicPaperReadingMinutes,
  listFeaturedPublicPapers,
  listPublicPapersByGroup,
  listPublicPapers,
  publicPaperKindLabels,
} from "./papers-data"

function getRepoRoot() {
  const currentDirectory = process.cwd()

  return path.basename(currentDirectory) === "next-app"
    ? path.resolve(currentDirectory, "..")
    : currentDirectory
}

export async function getPublicPaperBody(slug: string) {
  const paper = getPublicPaper(slug)

  if (!paper) {
    return null
  }

  const absolutePath = path.join(getRepoRoot(), paper.filePath)
  return readFile(absolutePath, "utf8")
}
