# Cantikaputri Febrianti — Professional Portfolio

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
[![Live Site](https://img.shields.io/badge/Live%20Site-cantikapf.github.io-blue?style=for-the-badge&logo=github)](https://cantikapf.github.io)

Welcome to the source code of my professional portfolio website. I am a **Business Analyst** and **International Relations** graduate from Bina Nusantara University, with a focus on data analytics, geospatial intelligence, and strategic communication.

---

## 🗂️ Portfolio Sections

| Section | Content |
|---------|---------|
| [02 : Research](https://cantikapf.github.io/works.html) | Published academic papers & research |
| [03 : Work Experience](https://cantikapf.github.io/experience.html) | Professional roles across Bank Mandiri, DPR RI, LPEI |
| [04 : Certification](https://cantikapf.github.io/certification.html) | Professional certifications |
| [05 : Projects](https://cantikapf.github.io/projects.html) | Technical & data projects |

---

## 🚀 Featured Projects

### 001 · Tangsel Coffeeshop Business
> Interactive geospatial dashboard mapping 300+ coffee shops in Tangerang Selatan to support retail banking MSME acquisition strategy.

[![Repo](https://img.shields.io/badge/GitHub-Tangsel--Coffeeshop--Business-181717?logo=github)](https://github.com/cantikapf/Tangsel-Coffeeshop-Business)
[![Live](https://img.shields.io/badge/Live-Dashboard-blue?logo=googlechrome)](https://cantikapf.github.io/Tangsel-Coffeeshop-Business/)

---

### 002 · My Digital Academy 2025 — Bank Mandiri
> Strategic project analyzing Bank Mandiri's Livin' apps competitive landscape, proposing UI/UX prototypes and go-to-market plans to boost digital banking adoption.

---

### 003 · Indonesia's Export Destination
> Tableau dashboard visualizing Indonesia's global trade routes, top export commodities, and destination countries across 2023 data.

---

### 004 · IR Study Companion
> Fine-tuned GPT model designed as a study companion for International Relations students — covering theories, historical contexts, and current global affairs.

[![Live](https://img.shields.io/badge/Live-IR%20Guide-blue?logo=googlechrome)](https://ir-guide.netlify.app/)

---

### 005 · WhatBusinessInTangsel — Business Prospect Analytics

> Interactive BI dashboard helping entrepreneurs identify optimal business locations across 7 sub-districts in Tangerang Selatan using real BPS 2023 demographic data and OpenStreetMap POI data.

[![Repo](https://img.shields.io/badge/GitHub-tangsel--bisnis--v2-181717?logo=github)](https://github.com/cantikapf/tangsel-bisnis-v2)
[![Live](https://img.shields.io/badge/Live-Dashboard-blue?logo=googlechrome)](https://whatbusinessintangsel.netlify.app)

![WhatBusinessInTangsel Preview](assets/images/project5.png)

**Key Features:**
- 8-metric weighted scoring engine (demographics, competitor density, PDRB, rent cost, traffic, trend, POI)
- Interactive choropleth map with click-to-analyze per sub-district
- Side-by-side district comparison with radar charts
- Real data: BPS 2023 census + OpenStreetMap Overpass API
- Built with Next.js 14 + TypeScript

---

## 💻 Technical Architecture

The portfolio uses a **Dynamic Template Architecture** for maintainability:

- **Single `detail.html` template** — replaces 24+ static pages; content is injected dynamically from `assets/js/data.js` via URL params (`?type=&id=`)
- **Centralized `data.js` database** — all section content (HTML strings) stored in one `portfolioData` object
- **Responsive Bootstrap grid** — carousel-based navigation across all sections
- **Rich media embeds** — Tableau dashboards, Google Slides iframes, browser-chrome mockup frames

---

## 🔗 Related Repositories

- [WhatBusinessInTangsel BI Dashboard](https://github.com/cantikapf/tangsel-bisnis-v2)
- [Tangsel Coffeeshop Business](https://github.com/cantikapf/Tangsel-Coffeeshop-Business)
- [Parliamentary Diplomacy Sentiment Analysis](https://github.com/cantikapf/IPU144_sentiment_analysis)

---

## 📬 Let's Connect

- **LinkedIn:** [Cantikaputri Febrianti](https://www.linkedin.com/in/cantikaputri-febrianti/)
- **Email:** cantikapf.7@gmail.com
- **ResearchGate:** [Cantikaputri Febrianti](https://www.researchgate.net/profile/Cantikaputri-Febrianti)

---

*UI foundation adapted from the Univers template (Free-CSS).*
