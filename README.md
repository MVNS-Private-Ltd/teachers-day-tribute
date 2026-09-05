# Teacher's Day Website

A single-page tribute site with a password gate. Each teacher's password unlocks
their own themed page (purple / pink / red / blue), with a floating 3D particle-net
background (Three.js), a time-aware typed greeting, and a heartfelt message.

## Passwords
- Deepshikha Mam (Chemistry) -> chemistry
- Palak Mam (Physics) -> physics
- Sandeep Sir (Maths) -> maths
- Rachna Mam (Science) -> science

Edit the messages, names, or colors in src/data/teachers.js.

## Run locally
npm install
npm run dev

## Build for deployment
npm run build

This outputs a static site to dist/ - upload that folder to any static host
(Netlify, Vercel, GitHub Pages, etc.).
