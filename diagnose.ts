import { prisma } from "./lib/services/db";

async function diagnose() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });
  
  console.log("DIAGNOSTIC_START");
  console.log(JSON.stringify(posts, null, 2));
  console.log("DIAGNOSTIC_END");
  process.exit(0);
}

diagnose();
