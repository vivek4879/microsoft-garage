import { prisma } from "./lib/services/db";

async function check() {
  const pending = await prisma.post.count({ where: { status: 'pending' } });
  const rejected = await prisma.post.count({ where: { status: 'rejected' } });
  const approved = await prisma.post.count({ where: { status: 'approved' } });
  const unscored = await prisma.post.count({ where: { aiScore: null } });

  console.log("--- DB STATUS ---");
  console.log("Pending:", pending);
  console.log("Rejected:", rejected);
  console.log("Approved:", approved);
  console.log("Unscored:", unscored);

  const lastRejected = await prisma.post.findMany({
    where: { status: 'rejected' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("--- LAST REJECTED ---");
  console.log(JSON.stringify(lastRejected, null, 2));
  
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
