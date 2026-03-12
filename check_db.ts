import { prisma } from "./lib/services/db";

async function check() {
  const counts = await prisma.post.groupBy({
    by: ['status'],
    _count: true
  });
  
  const scores = await prisma.post.findMany({
    where: { status: 'pending' },
    select: { aiScore: true, id: true, sourceTitle: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("--- COUNTS ---");
  console.log(JSON.stringify(counts, null, 2));
  console.log("--- RECENT PENDING ---");
  console.log(JSON.stringify(scores, null, 2));
  process.exit(0);
}

check();
