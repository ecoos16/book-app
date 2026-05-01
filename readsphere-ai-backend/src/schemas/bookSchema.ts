export const bookMetadataSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    author: { type: "string" },
    publisher: { type: "string" },
    description: { type: "string" },
    page_count: { type: "number" },
    published_year: { type: "number" },
    language: { type: "string" },

    categories: {
      type: "array",
      items: { type: "string" },
    },

    isbn: { type: "string" },
    cover_url: { type: "string" },
    confidence: { type: "number" },

    warnings: {
      type: "array",
      items: { type: "string" },
    },

    sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          url: { type: "string" },
        },
        required: ["title", "url"],
      },
    },
  },

  required: [
    "title",
    "author",
    "publisher",
    "description",
    "page_count",
    "published_year",
    "language",
    "categories",
    "isbn",
    "cover_url",
    "confidence",
    "warnings",
    "sources",
  ],
};