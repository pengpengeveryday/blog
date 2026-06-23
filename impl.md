# Implementation Notes

## Overview

This project is a Nuxt 3 blog application with client-side IndexedDB storage and optional server-side Markdown embedding.

- Framework: `Nuxt 3`
- UI: `Vue 3`
- Mobile support: `Capacitor` for Android
- Styling: `Tailwind CSS` via `@tailwindcss/postcss`
- Markdown rendering: `marked`
- Client database: `idb` (IndexedDB wrapper)

## Key files and responsibilities

### `package.json`

- Defines application dependencies and dev dependencies.
- `nuxt`, `vue`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` for app runtime.
- `@tailwindcss/postcss`, `tailwindcss`, `autoprefixer` for styling.
- `gray-matter` and `marked` for Markdown parsing.
- `idb` for browser database access.

### `nuxt.config.ts`

- Enables Nuxt devtools.
- Loads global CSS from `~/assets/css/main.css`.
- Configures PostCSS plugin `@tailwindcss/postcss`.
- Uses Nitro static preset with output directory `dist`.

### `app.vue`

- Base application wrapper using `<NuxtLayout>` and `<NuxtPage>`.

## Pages

### `pages/index.vue`

- Blog home page listing posts.
- Fetches tags and posts from client storage via `composables/useDb`.
- Supports filtering by `tag` query parameter.

### `pages/new.vue`

- New post creation page.
- Collects title, date, tags, and Markdown content.
- Converts Markdown to HTML with `marked.parse()`.
- Computes slug, description, and reading time.
- Saves posts through `savePost()` and navigates to `/posts/{slug}`.

### `pages/posts/[slug].vue`

- Article details page.
- Loads a single post by slug from IndexedDB.
- Displays title, date, modified date, tags, and rendered HTML.
- Uses `TagEditor` component for tag updates.

### `pages/tags/[tag].vue`

- Lists posts that contain a specific tag.

### `pages/tags/index.vue`

- Displays all tags with counts.
- Tags are loaded from client storage.

## Components

### `components/TagEditor.vue`

- Displays a post's tags.
- Supports long-press to enter editing mode.
- Allows adding and removing tags.
- Persists updated tags back to IndexedDB for the current post.
- Clicking a tag navigates to `/tags/{tag}`.

## Client data layer

### `composables/useDb.ts`

- Client-only database helper using `idb`.
- `PostRecord` interface defines the post structure.
- IndexedDB database name: `blog-db`, version `1`.
- Object store name: `posts`, key path: `slug`.

Functions:

- `formatNow()` - current timestamp string.
- `getDb()` - opens the DB on the client only.
- `seedPosts()` - seeds initial posts if the store is empty.
- `getAllPostsClient()` - returns all posts sorted by date desc.
- `getPostBySlugClient(slug)` - returns a single post.
- `getPostsByTagClient(tag)` - filters posts by tag.
- `getAllTagsClient()` - aggregates tags and counts.
- `savePost(post)` - inserts or updates a post.

## Server-side Markdown utility

### `server/api/posts.get.ts`

- API endpoint that returns embedded Markdown posts.
- Delegates to `getEmbeddedPosts()`.

### `server/utils/posts-data.ts`

- Reads Markdown files from `content/posts`.
- Uses `gray-matter` to parse frontmatter and content.
- Uses `marked.parse()` to render Markdown to HTML.
- Computes description and reading time from Markdown content.
- Returns sorted posts by date descending.

## Notes

- The `content/posts` directory is currently empty, so server-side embedded posts API returns an empty array.
- The application is primarily client-driven, with IndexedDB as the storage backend for posts.
- Tag editing is interactive and persisted via `TagEditor.vue`.
