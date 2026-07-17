/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true

  // Previously this needed experimental.outputFileTracingRoot and
  // experimental.externalDir here, because platform-memory/ and
  // departments/ lived in a sibling directory outside this Next.js
  // project's own root — a monorepo layout. That depended on Vercel's
  // "Include files outside the Root Directory" build setting being
  // correctly enabled, plus Next's own file tracing correctly reaching
  // outside the project directory, both of which are real things that
  // can go wrong independently. Restructured so platform-memory/ and
  // departments/ live INSIDE this project root instead — standard
  // webpack module resolution just works, no special settings, no
  // monorepo-specific Vercel behavior to depend on getting right.
};

module.exports = nextConfig;
