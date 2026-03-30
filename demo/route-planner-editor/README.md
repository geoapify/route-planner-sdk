# Route Planner Editor Demo (Vite)

Quick start:

1) Install demo dependencies:

cd demo/route-planner-editor
npm install

2) Run the dev server:

npm run dev

3) Open in browser:

http://localhost:5173/

Build output:

npm run build
npm run preview

Notes:

- The demo imports SDK sources directly from `src/` via the Vite alias `@sdk`.
- The page loads MapLibre + Geoapify tiles from CDNs, so network access is required.
