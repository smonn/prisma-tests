# Comparison of Prisma models

Comparison of setups to check performance and Prisma generates queries.

- JSONB column
- shared table with nullable fields
- highly normalized table with "inheritance"

### Performance

Create time is the duration to insert N rows.

```
Config { testStat: 'create', testCount: 50, targetCount: 10000 }
Warming up...
Running json test...
json: avg 162.45 (min 151.05 - max 197.95)
Running nullable test...
nullable: avg 127.43 (min 117.94 - max 153.33)
Running inheritance test...
inheritance: avg 126.42 (min 114.79 - max 139.87)
```

Query time is the `count(*)` query.

```
Config { testStat: 'query', testCount: 50, targetCount: 10000 }
Warming up...
Running json test...
json: avg 5.72 (min 4.24 - max 7.55)
Running nullable test...
nullable: avg 0.99 (min 0.82 - max 2.32)
Running inheritance test...
inheritance: avg 1.05 (min 0.89 - max 1.72)
```

> [!NOTE]
> It's possible the JSONB test could perform better if Prisma generated better SQL (see samples below). [Postgres GIN docs](https://www.postgresql.org/docs/14/gin-builtin-opclasses.html).

## Generated SQL

### JSONB

```sql
SELECT
	count(*)
FROM (
	SELECT
		"public"."JsonItem"."id"
	FROM
		"public"."JsonItem"
	WHERE (("public"."JsonItem"."json" #> ARRAY[$1]::text[])::jsonb::jsonb = $2
		AND ("public"."JsonItem"."json" #> ARRAY[$3]::text[])::jsonb::jsonb = $4) OFFSET $5) AS "sub"
```

### Nullable

```sql
SELECT
	count(*)
FROM (
	SELECT
		"public"."NullableItem"."id"
	FROM
		"public"."NullableItem"
	LEFT JOIN "public"."NullableTarget" AS "j1" ON ("j1"."id") = ("public"."NullableItem"."nullableTargetId")
WHERE ("j1"."type" = cast($1::text AS "public"."TargetType")
	AND "j1"."foo" = $2
	AND ("j1"."id" IS NOT NULL)) OFFSET $3) AS "sub"
```

### Inheritance

```sql
SELECT
	count(*)
FROM (
	SELECT
		"public"."InheritanceItem"."id"
	FROM
		"public"."InheritanceItem"
	LEFT JOIN "public"."InheritanceTarget" AS "j1" ON ("j1"."id") = ("public"."InheritanceItem"."inheritanceTargetId")
	LEFT JOIN "public"."FooInheritanceTarget" AS "j2" ON ("j2"."inheritanceTargetId") = ("j1"."id")
WHERE ("j1"."type" = cast($1::text AS "public"."TargetType")
	AND ("j2"."foo" = $2
		AND ("j2"."inheritanceTargetId" IS NOT NULL))
	AND ("j1"."id" IS NOT NULL)) OFFSET $3) AS "sub"
```
