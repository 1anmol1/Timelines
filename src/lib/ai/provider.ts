import { ContentItem, OrganizationSuggestion } from "@/types";

// ─── AI Provider Interface ──────────────────────────────────────────────────

export interface AIProvider {
  organizeContent(items: ContentItem[]): Promise<OrganizationSuggestion>;
  generateTitle(content: string): Promise<string>;
  generateDescription(content: string): Promise<string>;
}

// ─── Mock AI Provider ───────────────────────────────────────────────────────

export class MockAIProvider implements AIProvider {
  async organizeContent(items: ContentItem[]): Promise<OrganizationSuggestion> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Intelligently organize based on content
    const textItems = items.filter((i) => i.type === "text");
    const imageItems = items.filter((i) => i.type === "image");
    const videoItems = items.filter((i) => i.type === "video");
    const linkItems = items.filter((i) => i.type === "link");

    const nodes = [];
    let position = 0;

    // Create introduction node from first text content
    if (textItems.length > 0) {
      nodes.push({
        title: "Introduction",
        description: "Setting the stage",
        position: position++,
        blocks: [
          {
            type: "TEXT" as const,
            content: JSON.stringify({ text: textItems[0].content, format: "plain" }),
          },
        ],
      });
    }

    // Group images into a visual node
    if (imageItems.length > 0) {
      nodes.push({
        title: "Visual Journey",
        description: "Key moments captured",
        position: position++,
        blocks: imageItems.map((item) => ({
          type: "IMAGE" as const,
          content: JSON.stringify({ url: item.content, caption: "" }),
        })),
      });
    }

    // Add remaining text as story nodes
    for (let i = 1; i < textItems.length; i++) {
      nodes.push({
        title: `Chapter ${position + 1}`,
        description: textItems[i].content.substring(0, 100),
        position: position++,
        blocks: [
          {
            type: "TEXT" as const,
            content: JSON.stringify({ text: textItems[i].content, format: "plain" }),
          },
        ],
      });
    }

    // Add videos
    for (const item of videoItems) {
      nodes.push({
        title: "Watch This",
        description: "A key video moment",
        position: position++,
        blocks: [
          {
            type: "VIDEO" as const,
            content: JSON.stringify({ url: item.content }),
          },
        ],
      });
    }

    // Add links
    if (linkItems.length > 0) {
      nodes.push({
        title: "Resources & Links",
        description: "Relevant references",
        position: position++,
        blocks: linkItems.map((item) => ({
          type: "LINK" as const,
          content: JSON.stringify({ url: item.content, title: item.content }),
        })),
      });
    }

    // Always add at least one node
    if (nodes.length === 0) {
      nodes.push({
        title: "Getting Started",
        description: "Begin your journey here",
        position: 0,
        blocks: [
          {
            type: "TEXT" as const,
            content: JSON.stringify({ text: "Start adding your content here", format: "plain" }),
          },
        ],
      });
    }

    const firstText = textItems[0]?.content || "My Timeline";
    const titleWords = firstText.split(" ").slice(0, 5).join(" ");

    return {
      title: titleWords || "Untitled Timeline",
      description: `A journey through ${nodes.length} chapters`,
      nodes,
    };
  }

  async generateTitle(content: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const words = content.split(" ").filter((w) => w.length > 3);
    const titleWords = words.slice(0, 4).join(" ");
    return titleWords || "My Timeline";
  }

  async generateDescription(content: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return content.length > 150
      ? content.substring(0, 150) + "..."
      : content || "An interactive timeline experience";
  }
}

// ─── Provider Factory ───────────────────────────────────────────────────────

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  const providerType = process.env.AI_PROVIDER || "mock";

  switch (providerType) {
    case "mock":
      providerInstance = new MockAIProvider();
      break;
    // Future: case "gemini": providerInstance = new GeminiAIProvider(); break;
    // Future: case "openai": providerInstance = new OpenAIProvider(); break;
    default:
      providerInstance = new MockAIProvider();
  }

  return providerInstance;
}
