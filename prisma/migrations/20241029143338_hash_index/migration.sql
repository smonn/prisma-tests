-- DropIndex
DROP INDEX "BarInheritanceTarget_bar_idx";

-- DropIndex
DROP INDEX "FooInheritanceTarget_foo_idx";

-- DropIndex
DROP INDEX "NullableTarget_bar_idx";

-- DropIndex
DROP INDEX "NullableTarget_foo_idx";

-- CreateIndex
CREATE INDEX "BarInheritanceTarget_bar_idx" ON "BarInheritanceTarget" USING HASH ("bar");

-- CreateIndex
CREATE INDEX "FooInheritanceTarget_foo_idx" ON "FooInheritanceTarget" USING HASH ("foo");

-- CreateIndex
CREATE INDEX "NullableTarget_foo_idx" ON "NullableTarget" USING HASH ("foo");

-- CreateIndex
CREATE INDEX "NullableTarget_bar_idx" ON "NullableTarget" USING HASH ("bar");
