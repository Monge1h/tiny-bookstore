-- CreateTable
CREATE TABLE "BookImage" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BookImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookImage_bookId_idx" ON "BookImage"("bookId");

-- CreateIndex
CREATE INDEX "BookImage_bookId_isPrimary_idx" ON "BookImage"("bookId", "isPrimary");

-- AddForeignKey
ALTER TABLE "BookImage" ADD CONSTRAINT "BookImage_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
