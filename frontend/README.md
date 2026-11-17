# 🎨 PaathShala AI - Frontend Application

Modern, high-performance Single Page Application (SPA) built with **React 19**, **TypeScript**, **TailwindCSS v4**, **Framer Motion**, and **Three.js**.

## 🚀 Tech Stack
- **Framework:** React 19 + Vite 8
- **Language:** TypeScript 5.0+
- **Styling:** TailwindCSS v4 with `@tailwindcss/vite`
- **Animations & 3D:** Framer Motion, GSAP, Three.js, React Three Fiber (`@react-three/fiber`), Drei
- **State Management:** Zustand
- **Routing:** React Router DOM v7
- **Markdown & Code Rendering:** React Markdown, Remark GFM, Rehype Highlight

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create `.env` in the `frontend` folder:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 🐳 Docker Deployment
The frontend is containerized using a multi-stage Nginx Alpine build:
```bash
docker build -t paathshala-frontend .
docker run -p 8080:80 paathshala-frontend
```
