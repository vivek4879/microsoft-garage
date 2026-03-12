-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL DEFAULT 'openai',
    "aiApiKey" TEXT,
    "postFrequency" INTEGER NOT NULL DEFAULT 2,
    "telegramChatId" TEXT,
    "igAccessToken" TEXT,
    "igPageId" TEXT,
    "tavilyApiKey" TEXT,
    "subreddits" TEXT NOT NULL DEFAULT '["funny","AskReddit","mildlyinteresting"]',
    "bestPostTimes" TEXT NOT NULL DEFAULT '[9,12,18]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analytics" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analytics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
