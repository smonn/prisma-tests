-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('foo', 'bar');

-- CreateTable
CREATE TABLE "JsonItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "json" JSONB NOT NULL,

    CONSTRAINT "JsonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NullableItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nullableTargetId" TEXT NOT NULL,

    CONSTRAINT "NullableItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NullableTarget" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "TargetType" NOT NULL,
    "foo" TEXT,
    "bar" TEXT,

    CONSTRAINT "NullableTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InheritanceItem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inheritanceTargetId" TEXT NOT NULL,

    CONSTRAINT "InheritanceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InheritanceTarget" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "TargetType" NOT NULL,

    CONSTRAINT "InheritanceTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooInheritanceTarget" (
    "inheritanceTargetId" TEXT NOT NULL,
    "foo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BarInheritanceTarget" (
    "inheritanceTargetId" TEXT NOT NULL,
    "bar" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "JsonItem_json_idx" ON "JsonItem" USING GIN ("json" jsonb_path_ops);

-- CreateIndex
CREATE INDEX "NullableItem_nullableTargetId_idx" ON "NullableItem"("nullableTargetId");

-- CreateIndex
CREATE INDEX "NullableTarget_type_idx" ON "NullableTarget"("type");

-- CreateIndex
CREATE INDEX "NullableTarget_foo_idx" ON "NullableTarget"("foo");

-- CreateIndex
CREATE INDEX "NullableTarget_bar_idx" ON "NullableTarget"("bar");

-- CreateIndex
CREATE INDEX "InheritanceItem_inheritanceTargetId_idx" ON "InheritanceItem"("inheritanceTargetId");

-- CreateIndex
CREATE INDEX "InheritanceTarget_type_idx" ON "InheritanceTarget"("type");

-- CreateIndex
CREATE UNIQUE INDEX "FooInheritanceTarget_inheritanceTargetId_key" ON "FooInheritanceTarget"("inheritanceTargetId");

-- CreateIndex
CREATE INDEX "FooInheritanceTarget_foo_idx" ON "FooInheritanceTarget"("foo");

-- CreateIndex
CREATE UNIQUE INDEX "BarInheritanceTarget_inheritanceTargetId_key" ON "BarInheritanceTarget"("inheritanceTargetId");

-- CreateIndex
CREATE INDEX "BarInheritanceTarget_bar_idx" ON "BarInheritanceTarget"("bar");

-- AddForeignKey
ALTER TABLE "NullableItem" ADD CONSTRAINT "NullableItem_nullableTargetId_fkey" FOREIGN KEY ("nullableTargetId") REFERENCES "NullableTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InheritanceItem" ADD CONSTRAINT "InheritanceItem_inheritanceTargetId_fkey" FOREIGN KEY ("inheritanceTargetId") REFERENCES "InheritanceTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FooInheritanceTarget" ADD CONSTRAINT "FooInheritanceTarget_inheritanceTargetId_fkey" FOREIGN KEY ("inheritanceTargetId") REFERENCES "InheritanceTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarInheritanceTarget" ADD CONSTRAINT "BarInheritanceTarget_inheritanceTargetId_fkey" FOREIGN KEY ("inheritanceTargetId") REFERENCES "InheritanceTarget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
