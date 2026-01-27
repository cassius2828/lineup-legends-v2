import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

interface BrokenImage {
  name: string;
  url: string;
  value: number;
}

interface RequestBody {
  brokenImages: BrokenImage[];
}

function generateMarkdown(brokenImages: BrokenImage[]): string {
  const timestamp = new Date().toISOString();
  const count = brokenImages.length;

  // Sort by value (highest first) then by name
  const sorted = [...brokenImages].sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.name.localeCompare(b.name);
  });

  let markdown = `# Broken Player Images Report

Generated: ${timestamp}

Total broken images: ${count}

## Players with Broken Images

| Player Name | Value | Image URL |
|-------------|-------|-----------|
`;

  for (const img of sorted) {
    // Escape pipe characters in URL
    const escapedUrl = img.url.replace(/\|/g, "\\|");
    markdown += `| ${img.name} | $${img.value} | ${escapedUrl} |\n`;
  }

  if (count === 0) {
    markdown += `| No broken images found | - | - |\n`;
  }

  markdown += `
## Summary by Value Tier

`;

  // Group by value
  const byValue: Record<number, BrokenImage[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  for (const img of brokenImages) {
    byValue[img.value]?.push(img);
  }

  for (let value = 5; value >= 1; value--) {
    const players = byValue[value] ?? [];
    markdown += `- **$${value} Players**: ${players.length} broken\n`;
  }

  return markdown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const { brokenImages } = body;

    if (!Array.isArray(brokenImages)) {
      return NextResponse.json(
        { error: "brokenImages must be an array" },
        { status: 400 },
      );
    }

    const markdown = generateMarkdown(brokenImages);

    // Ensure docs directory exists
    const docsDir = join(process.cwd(), "docs");
    try {
      await mkdir(docsDir, { recursive: true });
    } catch {
      // Directory might already exist, that's fine
    }

    // Write the markdown file
    const filePath = join(docsDir, "broken-player-images.md");
    await writeFile(filePath, markdown, "utf-8");

    return NextResponse.json({
      success: true,
      filePath: "docs/broken-player-images.md",
      count: brokenImages.length,
    });
  } catch (error) {
    console.error("Error generating broken images report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
