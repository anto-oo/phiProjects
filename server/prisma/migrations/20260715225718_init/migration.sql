-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Node" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "parentId" TEXT,
    "projectId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Node_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Node" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Node_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NodeDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockingNodeId" TEXT NOT NULL,
    "blockedNodeId" TEXT NOT NULL,
    CONSTRAINT "NodeDependency_blockingNodeId_fkey" FOREIGN KEY ("blockingNodeId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NodeDependency_blockedNodeId_fkey" FOREIGN KEY ("blockedNodeId") REFERENCES "Node" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "NodeDependency_blockingNodeId_blockedNodeId_key" ON "NodeDependency"("blockingNodeId", "blockedNodeId");
