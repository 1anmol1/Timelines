import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create demo user
  const passwordHash = await hash("demo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@timelines.app" },
    update: {},
    create: {
      email: "demo@timelines.app",
      name: "Demo User",
      passwordHash,
    },
  });

  // 2. Create timeline
  const timeline = await prisma.timeline.upsert({
    where: { ownerId_slug: { ownerId: user.id, slug: "my-hackathon-journey" } },
    update: {},
    create: {
      ownerId: user.id,
      title: "My Hackathon Journey",
      slug: "my-hackathon-journey",
      description: "Documenting our path to building Timelines for the iQOO Hackathon 2026.",
      coverUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  // Clear existing nodes for clean slate
  await prisma.node.deleteMany({ where: { timelineId: timeline.id } });

  // 3. Create nodes
  const n1 = await prisma.node.create({
    data: {
      timelineId: timeline.id,
      title: "The Idea",
      description: "How we came up with the concept.",
      position: 0,
      isLocked: false,
    }
  });
  await prisma.nodeBlock.create({
    data: {
      nodeId: n1.id,
      type: "TEXT",
      position: 0,
      content: JSON.stringify({ text: "Social media feeds are disconnected. We wanted to build a platform where content becomes a connected journey.", format: "plain" })
    }
  });

  const n2 = await prisma.node.create({
    data: {
      timelineId: timeline.id,
      title: "Why We Built It",
      description: "The core problem we are solving.",
      position: 1,
      isLocked: false,
    }
  });
  await prisma.nodeBlock.create({
    data: {
      nodeId: n2.id,
      type: "TEXT",
      position: 0,
      content: JSON.stringify({ text: "People learn and experience things sequentially. A timeline structure enforces this.", format: "plain" })
    }
  });

  const n3 = await prisma.node.create({
    data: {
      timelineId: timeline.id,
      title: "First Prototype",
      position: 2,
      isLocked: false,
    }
  });
  await prisma.nodeBlock.create({
    data: {
      nodeId: n3.id,
      type: "IMAGE",
      position: 0,
      content: JSON.stringify({ url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop", caption: "Early wireframes" })
    }
  });

  const n4 = await prisma.node.create({
    data: {
      timelineId: timeline.id,
      title: "The Breakthrough",
      description: "We finally figured out the UI design.",
      position: 3,
      isLocked: true, // This one is locked!
    }
  });
  await prisma.nodeBlock.create({
    data: {
      nodeId: n4.id,
      type: "VIDEO",
      position: 0,
      content: JSON.stringify({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" })
    }
  });
  // Rule: Must complete n3
  await prisma.unlockRule.create({
    data: {
      nodeId: n4.id,
      type: "PREVIOUS_COMPLETED",
      config: JSON.stringify({ sourceNodeId: n3.id })
    }
  });

  const n5 = await prisma.node.create({
    data: {
      timelineId: timeline.id,
      title: "Final Product",
      position: 4,
      isLocked: true,
    }
  });
  await prisma.nodeBlock.create({
    data: {
      nodeId: n5.id,
      type: "TEXT",
      position: 0,
      content: JSON.stringify({ text: "And here it is. Timelines.", format: "plain" })
    }
  });
  // Rule: Must complete n4
  await prisma.unlockRule.create({
    data: {
      nodeId: n5.id,
      type: "PREVIOUS_COMPLETED",
      config: JSON.stringify({ sourceNodeId: n4.id })
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
