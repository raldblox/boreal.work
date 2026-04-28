export type EditorialLeadField = {
  label: string
  value: string
}

export type EditorialOutlineItem = {
  depth: number
  text: string
}

export function extractEditorialDocument(markdown: string) {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim()
  const lines = normalized.split("\n")
  let index = 0

  while (index < lines.length && lines[index].trim() === "") {
    index += 1
  }

  let title: string | null = null

  if (lines[index]?.startsWith("# ")) {
    title = lines[index].replace(/^#\s+/, "").trim()
    index += 1
  }

  const leadFields: EditorialLeadField[] = []

  while (index < lines.length) {
    while (index < lines.length && lines[index].trim() === "") {
      index += 1
    }

    const line = lines[index]?.trim()

    if (!line || line.startsWith("#")) {
      break
    }

    const match = /^([A-Za-z][A-Za-z ]+):\s*(.+)$/.exec(line)

    if (!match) {
      break
    }

    leadFields.push({
      label: match[1],
      value: match[2],
    })

    index += 1
  }

  while (index < lines.length && lines[index].trim() === "") {
    index += 1
  }

  return {
    body: normalizeEditorialBody(lines.slice(index).join("\n").trim()),
    leadFields,
    title,
  }
}

export function getEditorialLeadValue(
  leadFields: EditorialLeadField[],
  label: string
) {
  return leadFields.find((field) => field.label === label)?.value ?? null
}

export function extractEditorialOutline(markdown: string, maxDepth = 3) {
  return markdown
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => {
      const match = /^(#{2,6})\s+(.+)$/.exec(line.trim())

      if (!match) {
        return null
      }

      const depth = match[1].length

      if (depth > maxDepth) {
        return null
      }

      return {
        depth,
        text: stripHeadingLabelNumbering(match[2].trim()),
      }
    })
    .filter((item): item is EditorialOutlineItem => item !== null)
}

function normalizeEditorialBody(markdown: string) {
  return markdown
    .split("\n")
    .map((line) => stripHeadingNumbering(line))
    .join("\n")
}

function stripHeadingNumbering(line: string) {
  return line.replace(
    /^(#{2,6}\s+)(?:\d+(?:\.\d+)*[.)]?|[IVXLC]+[.)]?)\s+/i,
    "$1"
  )
}

function stripHeadingLabelNumbering(label: string) {
  return label.replace(/^(?:\d+(?:\.\d+)*[.)]?|[IVXLC]+[.)]?)\s+/i, "")
}
