import { Prisma, PrismaClient } from "@prisma/client";
import type { InputJsonValue } from "@prisma/client/runtime/library";

const prisma = new PrismaClient({
  log: ["query"],
});

async function main() {
  const targetCount = 1;
  const testCount = 1;
  const testStat: "total" | "query" | "create" = "total";
  await cleanup();
  const targets = createManyTargets(targetCount);
  const expectedFooLeftCount = targets.filter(
    (target) => target.type === "foo" && target.foo === "left"
  ).length;

  const tests: Record<
    string,
    (
      targets: Target[]
    ) => Promise<[{ total: number; create: number; query: number }, number]>
  > = {
    json: jsonTest,
    nullable: nullableTest,
    inheritance: inheritanceTest,
  };

  console.log("Config", { testStat, testCount, targetCount });

  console.log("Warming up...");
  for (let i = 0; i < 10; i++) {
    await jsonTest(targets);
    await nullableTest(targets);
    await inheritanceTest(targets);
  }

  for (const [name, testFn] of Object.entries(tests)) {
    console.log(`Running ${name} test...`);

    let totalTime = 0;
    let bestTime = Infinity;
    let worstTime = 0;

    for (let i = 0; i < testCount; i++) {
      process.stdout.write(`\r${name} test ${i}/${testCount}...`);

      await cleanup();

      const [time, fooCount] = await runTest(testFn, targets);
      totalTime += time[testStat];
      bestTime = Math.min(bestTime, time[testStat]);
      worstTime = Math.max(worstTime, time[testStat]);

      if (fooCount !== expectedFooLeftCount) {
        console.error(
          `\r${name} test failed: expected ${expectedFooLeftCount} foo left targets, got ${fooCount}`
        );
        process.exit(1);
      }
    }

    const averageTime = totalTime / testCount;

    console.log(
      `\r${name}: avg ${averageTime.toFixed(2)} (min ${bestTime.toFixed(
        2
      )} - max ${worstTime.toFixed(2)})`
    );
  }
}

async function runTest(
  testFn: (
    targets: Target[]
  ) => Promise<[{ total: number; create: number; query: number }, number]>,
  targets: Target[]
): Promise<[{ total: number; create: number; query: number }, number]> {
  const [time, fooCount] = await testFn(targets);
  return [time, fooCount];
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

async function jsonTest(
  targets: Target[]
): Promise<[{ total: number; create: number; query: number }, number]> {
  let total = performance.now();
  let create = performance.now();

  await prisma.jsonItem.createMany({
    data: targets.map(
      (target): Prisma.JsonItemCreateManyInput => ({
        // Must cast to avoid type errors.
        // Can guard this with a Zod schema, but we'd also need to check its value
        // during reads and bad migrations or risky manual SQL queries could
        // produce incorrect results.
        json: target as unknown as InputJsonValue,
      })
    ),
  });

  create = performance.now() - create;

  let query = performance.now();

  // Ideally this would rely on the index we created for the json column,
  // but it generates SQL similar to this:
  //
  // SELECT COUNT(*) FROM (SELECT "public"."JsonItem"."id" FROM "public"."JsonItem" WHERE (("public"."JsonItem"."json"#>ARRAY[$1]::text[])::jsonb::jsonb = $2 AND ("public"."JsonItem"."json"#>ARRAY[$3]::text[])::jsonb::jsonb = $4) OFFSET $5) AS "sub"
  //
  // This means it won't rely on the index for queries such as the one below.
  const fooCount = await prisma.jsonItem.count({
    where: {
      AND: [
        {
          json: {
            path: ["type"],
            equals: "foo",
          },
        },
        {
          json: {
            path: ["foo"],
            equals: "left",
          },
        },
      ],
    },
  });

  query = performance.now() - query;
  total = performance.now() - total;

  return [{ total, create, query }, fooCount];
}

async function nullableTest(
  targets: Target[]
): Promise<[{ total: number; create: number; query: number }, number]> {
  // setup code, not part of the test
  const fooLeftTarget = await prisma.nullableTarget.create({
    data: { type: "foo", foo: "left" },
  });
  const fooRightTarget = await prisma.nullableTarget.create({
    data: { type: "foo", foo: "right" },
  });
  const barUpTarget = await prisma.nullableTarget.create({
    data: { type: "bar", bar: "up" },
  });
  const barDownTarget = await prisma.nullableTarget.create({
    data: { type: "bar", bar: "down" },
  });

  let total = performance.now();
  let create = performance.now();

  await prisma.nullableItem.createMany({
    data: targets.map(
      (target): Prisma.NullableItemCreateManyInput => ({
        nullableTargetId:
          target.type === "foo"
            ? target.foo === "left"
              ? fooLeftTarget.id
              : fooRightTarget.id
            : target.bar === "up"
            ? barUpTarget.id
            : barDownTarget.id,
      })
    ),
  });

  create = performance.now() - create;

  let query = performance.now();

  const fooCount = await prisma.nullableItem.count({
    where: {
      nullableTarget: {
        type: "foo",
        foo: "left",
      },
    },
  });

  query = performance.now() - query;
  total = performance.now() - total;

  return [{ total, create, query }, fooCount];
}

async function inheritanceTest(
  targets: Target[]
): Promise<[{ total: number; create: number; query: number }, number]> {
  // setup code, not part of the test
  const fooLeftTarget = await prisma.fooInheritanceTarget.create({
    data: {
      foo: "left",
      inheritanceTarget: {
        create: { type: "foo" },
      },
    },
  });
  const fooRightTarget = await prisma.fooInheritanceTarget.create({
    data: {
      foo: "right",
      inheritanceTarget: {
        create: { type: "foo" },
      },
    },
  });
  const barUpTarget = await prisma.barInheritanceTarget.create({
    data: {
      bar: "up",
      inheritanceTarget: {
        create: { type: "bar" },
      },
    },
  });
  const barDownTarget = await prisma.barInheritanceTarget.create({
    data: {
      bar: "down",
      inheritanceTarget: {
        create: { type: "bar" },
      },
    },
  });

  let total = performance.now();
  let create = performance.now();

  await prisma.inheritanceItem.createMany({
    data: targets.map(
      (target): Prisma.InheritanceItemCreateManyInput => ({
        inheritanceTargetId:
          target.type === "foo"
            ? target.foo === "left"
              ? fooLeftTarget.inheritanceTargetId
              : fooRightTarget.inheritanceTargetId
            : target.bar === "up"
            ? barUpTarget.inheritanceTargetId
            : barDownTarget.inheritanceTargetId,
      })
    ),
  });

  create = performance.now() - create;

  let query = performance.now();

  const fooCount = await prisma.inheritanceItem.count({
    where: {
      inheritanceTarget: {
        type: "foo",
        fooInheritanceTarget: {
          foo: "left",
        },
      },
    },
  });

  query = performance.now() - query;
  total = performance.now() - total;

  return [{ total, create, query }, fooCount];
}

async function cleanup() {
  await prisma.jsonItem.deleteMany();
  await prisma.nullableItem.deleteMany();
  await prisma.nullableTarget.deleteMany();
  await prisma.inheritanceItem.deleteMany();
  await prisma.fooInheritanceTarget.deleteMany();
  await prisma.barInheritanceTarget.deleteMany();
  await prisma.inheritanceTarget.deleteMany();
}

interface FooTarget {
  type: "foo";
  foo: "left" | "right";
}

interface BarTarget {
  type: "bar";
  bar: "up" | "down";
}

type Target = FooTarget | BarTarget;

function createTarget(type: Target["type"]): Target {
  if (type === "foo") {
    return {
      type: "foo",
      foo: Math.random() > 0.5 ? "left" : "right",
    };
  }

  return {
    type: "bar",
    bar: Math.random() > 0.5 ? "up" : "down",
  };
}

function createManyTargets(count: number): Target[] {
  return Array.from({ length: count }, () =>
    createTarget(Math.random() > 0.5 ? "foo" : "bar")
  );
}
