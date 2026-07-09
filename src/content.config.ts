// F17 (E3.1) — content layer. The site's content is data, typed by zod and read
// at build time; pages iterate these collections with getCollection() and render
// the cards/rows server-side (zero client JS, no inlined-JSON + client render).
//
// Each source file is a plain JSON array. The file() loader wants a unique `id`
// per record, and getCollection() makes no order guarantee — so a small parser
// stamps every record with its array index as both a fallback `id` and an
// `order` field the pages sort on, preserving the authored sequence exactly.
import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

/** file() loader over a JSON array: keep array order (getCollection doesn't
 *  promise one) and give each record a stable id. */
const orderedArray = (path: string) =>
  file(path, {
    parser: (text: string) =>
      JSON.parse(text).map((item: Record<string, unknown>, i: number) => ({
        id: (item.slug as string) ?? String(i),
        order: i,
        ...item,
      })),
  });

const projects = defineCollection({
  loader: orderedArray("content/projects/projects.json"),
  schema: z.object({
    order: z.number(),
    slug: z.string(),
    title: z.string(),
    blurb: z.string(),
    date: z.string(),
    links: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    build: z
      .object({
        stack: z.string().optional(),
        agents: z.string().optional(),
        models: z.string().optional(),
        tests: z.union([z.number(), z.string()]).optional(),
        firstPassGreen: z.union([z.string(), z.boolean()]).optional(),
        costNote: z.string().optional(),
      })
      .optional(),
  }),
});

const experience = defineCollection({
  loader: orderedArray("content/experience.json"),
  schema: z.object({
    order: z.number(),
    role: z.string(),
    org: z.string(),
    when: z.string(),
    what: z.string(),
  }),
});

const publications = defineCollection({
  loader: orderedArray("content/publications.json"),
  schema: z.object({
    order: z.number(),
    title: z.string(),
    href: z.string(),
    cite: z.string(),
  }),
});

const talks = defineCollection({
  loader: orderedArray("content/talks.json"),
  schema: z.object({
    order: z.number(),
    title: z.string(),
  }),
});

export const collections = { projects, experience, publications, talks };
