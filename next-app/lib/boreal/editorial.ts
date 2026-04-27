export type EditorialLeadField = {
  label: string
  value: string
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
    body: lines.slice(index).join("\n").trim(),
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
