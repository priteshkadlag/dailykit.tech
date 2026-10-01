/**
 * Markdown (as produced by linesToMarkdown) → an editable Word document: headings stay headings,
 * lists stay lists, and "---" page separators become page breaks. The docx library loads on demand.
 */
export async function markdownToDocx(markdown: string, { title }: { title?: string } = {}): Promise<Blob> {
  const { AlignmentType, Document, HeadingLevel, LevelFormat, Packer, PageBreak, Paragraph, TextRun } = await import("docx");
  const headings = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
  const unescape = (s: string) => s.replace(/^\\([#>\-*+]|\d+\.)/, "$1");

  const children = markdown
    .split(/\n{2,}|\n(?=- |\d+\. )/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (block === "---") return new Paragraph({ children: [new PageBreak()] });
      const heading = /^(#{1,6})\s+([\s\S]*)$/.exec(block);
      if (heading) return new Paragraph({ heading: headings[heading[1].length - 1], children: [new TextRun(heading[2])] });
      const bullet = /^- ([\s\S]*)$/.exec(block);
      if (bullet) return new Paragraph({ bullet: { level: 0 }, children: [new TextRun(bullet[1])] });
      const numbered = /^\d+\. ([\s\S]*)$/.exec(block);
      if (numbered) return new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun(numbered[1])] });
      return new Paragraph({ spacing: { after: 120 }, children: [new TextRun(unescape(block).replace(/\n/g, " "))] });
    });

  const doc = new Document({
    title,
    creator: "DailyKit",
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    numbering: {
      config: [{ reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }],
    },
    sections: [{ children: children.length ? children : [new Paragraph("")] }],
  });
  return Packer.toBlob(doc);
}
