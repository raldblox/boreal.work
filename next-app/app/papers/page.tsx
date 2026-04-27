import { PapersHubPage } from "@/components/home/papers-hub-page"
import { listPublicPapers } from "@/lib/boreal/papers"

export default function PapersPage() {
  return <PapersHubPage papers={listPublicPapers()} />
}
