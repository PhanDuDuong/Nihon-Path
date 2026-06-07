# Frontend - NihonPath

## Run locally

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies:

- `/api` to `http://localhost:8080`
- `/uploads` to `http://localhost:8080`

## Build

```bash
npm run build
```

## Structure

```text
frontend/
  public/      Static lesson audio and page images
  src/
    api/       REST API clients
    components/Shared UI components
    constants/ Shared constants
    content/   Static lesson content
    context/   React context providers
    data/      Lesson catalog and generated lesson data
    layouts/   App layouts
    pages/     Routed pages
    styles/    Global CSS
    utils/     Shared helpers
```
