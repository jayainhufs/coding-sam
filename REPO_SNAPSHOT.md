# Repository Snapshot (excluding binaries, secrets, .env, node_modules, .next)

## Directory Tree

app/
  api/ai/feedback/route.ts
  api/problems/route.ts
  api/run/route.ts
  fonts.ts
  globals.css
  home/page.tsx
  layout.tsx
  learn/[id]/page.tsx
  login/page.tsx
  onboarding/page.tsx
  page.tsx
  problems/page.tsx
  signup/page.tsx
components/
  Checklist.tsx
  CodeEditor.tsx
  CTAButtons.tsx
  FeedbackPanel.tsx
  HeroTitle.tsx
  LanguagePicker.tsx
  LearnWizard.tsx
  LevelCard.tsx
  NavBar.tsx
  ProblemIO.tsx
  QuestionList.tsx
  RecommendedToday.tsx
  Stepper.tsx
  StreakCard.tsx
data/
  problems.json
lib/
  AuthContext.tsx
  openai.ts
  problemsRepo.ts
  reco.ts
  types.ts
  utils.ts
prisma/
  schema.prisma
README.md
next.config.mjs
package.json
tailwind.config.mjs
tsconfig.json
.gitignore
```

## File Contents

### package.json

```json
{
    "name": "coding-sam",
    "version": "0.1.0",
    "private": true,
    "scripts": {
        "dev": "next dev -p 3000",
        "build": "next build",
        "start": "next start -p 3000",
        "lint": "next lint"
    },
    "dependencies": {
        "@monaco-editor/react": "^4.7.0",
        "clsx": "^2.1.1",
        "monaco-editor": "^0.54.0",
        "next": "^14.2.15",
        "openai": "^4.104.0",
        "react": "^18.3.1",
        "react-dom": "^18.3.1",
        "zod": "^3.25.76"
    },
    "devDependencies": {
        "@types/node": "^20.12.12",
        "@types/react": "18.2.66",
        "@types/react-dom": "18.2.22",
        "autoprefixer": "^10.4.21",
        "postcss": "^8.5.6",
        "tailwindcss": "^3.4.18",
        "typescript": "^5.4.5"
    }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": [
      "dom",
      "dom.iterable",
      "es2022"
    ],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./*"
      ]
    },
    "types": [
      "node"
    ],
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "tailwind.config.mjs"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

export default nextConfig
```

### tailwind.config.mjs

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        hufs: {
          green: '#146E7A',
          gray:  '#DADAD3',
          navy:  '#002D56',
          gold:  '#8D7150',
          silver:'#9D9FA2',
        },
      },
      fontFamily: {
        sans: ['var(--font-hufs)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
}
```

### postcss.config.js

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Dockerfile

```Dockerfile
# Node LTS
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || yarn || pnpm i

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json .
RUN npm i --omit=dev --ignore-scripts && npm cache clean --force
EXPOSE 3000
CMD ["npm","start"]
```

### next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
```

### data/problems.json

```json
[
  {
    "id": "max-subarray",
    "title": "연속 부분 배열의 최대합",
    "description": "정수 배열이 주어졌을 때, 연속 부분 배열 중 가장 큰 합을 구하세요. (Kadane)",
    "difficulty": "Medium",
    "tags": ["array", "dp", "kadane"],
    "samples": [
      { "input": "9\n-2 1 -3 4 -1 2 1 -5 4\n", "output": "6\n" },
      { "input": "5\n1 2 3 4 5\n", "output": "15\n" }
    ]
  },
  {
    "id": "two-sum",
    "title": "두 수의 합",
    "description": "정수 배열과 타겟이 주어지면 합이 타겟이 되는 두 인덱스를 반환하세요.",
    "difficulty": "Easy",
    "tags": ["array", "hashmap"],
    "samples": [
      { "input": "4 9\n2 7 11 15\n", "output": "0 1\n" }
    ]
  }
]
```

### lib/openai.ts

```ts
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const MODEL = process.env.OPENAI_MODEL || 'gpt-4.0-mini'
```

### lib/problemsRepo.ts

```ts
import problems from '@/data/problems.json'
import { Problem } from './types'

export async function getAllProblems(): Promise<Problem[]> {
  return problems as Problem[]
}

export async function getProblemById(id: string): Promise<Problem | null> {
  const all = await getAllProblems()
  return all.find(p => p.id === id) ?? null
}

export async function getRecommended(): Promise<Pick<Problem,'id'|'title'|'difficulty'>> {
  const all = await getAllProblems()
  // TODO: 추후 사용자 pref 기반 추천 로직 대체
  const pick = all[0]
  return { id: pick.id, title: pick.title, difficulty: pick.difficulty }
}
```

### lib/reco.ts

```ts
export function selectRecommended(problemIds: string[], pref:{ level:string; goal:string }){
    // level/goal 고려한 간단한 가중치 추천 로직으로 확장 예정
    return problemIds[0]
  }
  
```

### lib/types.ts

```ts
export type Difficulty = 'Easy'|'Medium'|'Hard'
export type Problem = {
  id: string
  title: string
  description: string
  difficulty: Difficulty
  tags?: string[]
}
```

### lib/utils.ts

```ts
export function sleep(ms:number){ return new Promise(res=>setTimeout(res,ms)) }
```

### app/fonts.ts

```ts
import localFont from 'next/font/local'

export const hufsFont = localFont({
  src: [
    // 가벼운 본문용 (Light)
    { path: './fonts/HUFS-L.ttf', weight: '300', style: 'normal' },
    // 기본 본문 (Medium)
    { path: './fonts/HUFS-M.ttf', weight: '500', style: 'normal' },
    // 제목/강조 (Bold)
    { path: './fonts/HUFS-B.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-hufs',
  display: 'swap',
})
```

### app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Tailwind가 없어도 내용은 보여야 하지만, 없을 경우 최소 폴백 */
html, body { height: 100%; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; }
.h1 { font-size: 2rem; font-weight: 800; }
.sub { color: #4b5563; }
.btn-primary { display:inline-flex; align-items:center; justify-content:center; padding:0.75rem 1rem; border-radius: 1rem; background:#22c55e; color:#fff; font-weight:600; }
.btn-ghost { display:inline-flex; align-items:center; justify-content:center; padding:0.75rem 1rem; border-radius: 1rem; background:#fff; color:#111827; border:1px solid #e5e7eb; font-weight:600; }
.card { background:#fff; border:1px solid #e5e7eb; border-radius: 1rem; padding:1rem; }
```

### app/layout.tsx

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { hufsFont } from './fonts'
import NavBar from '../components/NavBar'

export const metadata: Metadata = {
  title: 'coding-sam',
  description: 'AI 코딩 튜터가 탑재된 코딩 학습',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${hufsFont.variable} antialiased bg-white text-gray-900`}>
        <NavBar />
        {children}
      </body>
    </html>
  )
}
```

### app/page.tsx

```tsx
import Image from 'next/image'
import Link from 'next/link'

export default function Page() {
  return (
    <main className="min-h-[100svh] flex flex-col items-center justify-center text-center p-6">
      <div className="mb-6">
        <div className="text-3xl font-black tracking-tight">coding-sam</div>
      </div>

      <Image
        src="/Homepage_icon.jpg"
        alt="코딩샘 메인 일러스트"
        width={320}
        height={320}
        priority
        className="mb-8 w-[220px] sm:w-[260px] md:w-[320px] h-auto"
      />

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-6">
        재미있고 효과적인 무료 코딩 공부!
      </h1>

      <div className="w-full max-w-[420px] grid gap-3">
        <Link
          href="/home"
          className="inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-4 px-6 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition"
        >
          시작하기
        </Link>

        <button
          type="button"
          aria-disabled
          title="로그인 기능은 곧 제공됩니다"
          className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-4 px-6 font-semibold shadow-sm hover:bg-[#002D56]/5 cursor-not-allowed"
        >
          계정이 이미 있습니다
        </button>
      </div>
    </main>
  )
}
```

### app/home/page.tsx

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: string
  tags: string[]
}

export default function HomeDashboard() {
  const [problems, setProblems] = useState<Problem[]>([])

  useEffect(() => {
    fetch('/api/problems')
      .then((r) => r.json())
      .then(setProblems)
      .catch(() => {})
  }, [])

  const primary =
    'inline-flex items-center justify-center rounded-2xl bg-[#002D56] text-white font-semibold py-3 px-5 shadow-md ring-2 ring-[#002D56] hover:bg-[#002D56]/90 transition'
  const outline =
    'inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5'

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* 헤더 */}
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <span>환영합니다</span>
            <span>👋</span>
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            오늘도 한 문제로 실력 +1
          </p>
        </header>

        {/* 히어로 카드 + 스탯 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card className="md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">오늘의 추천 문제</p>
                <h3 className="mt-1 text-lg md:text-xl font-bold">
                  {problems[0]?.title ?? '문제 로딩 중...'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {problems[0]?.description ?? '잠시만요…'}
                </p>
              </div>
              <div className="hidden md:block">
                <DifficultyPill level={problems[0]?.difficulty} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                className={primary}
                href={problems[0] ? `/learn/${problems[0].id}` : '/problems'}
              >
                지금 풀기
              </Link>
              <Link className={outline} href="/problems">
                문제 선택
              </Link>
            </div>
          </Card>

          <Card>
            <p className="text-sm text-gray-500">나의 오늘</p>
            <div className="mt-2 flex items-center gap-6">
              <Stat label="연속 학습일" value="3일" />
              <Stat label="획득 XP" value="120" />
            </div>
          </Card>
        </section>

        {/* 추천 문제 그리드 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">🔥 추천 문제 모음</h2>
            <Link
              href="/problems"
              className="text-sm text-[#002D56] hover:underline"
            >
              전체보기
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {problems.map((p) => (
              <ProblemCard key={p.id} p={p} />
            ))}
          </div>
        </section>

        {/* AI 튜터 CTA */}
        <section id="tutor" className="mb-16">
          <Card className="bg-gradient-to-r from-hufs-green/15 to-hufs-gray/20 ring-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">AI 튜터에게 바로 물어보기</h3>
                <p className="text-sm text-gray-600 mt-1">
                  막히는 코드를 붙여넣고 힌트를 받아보세요.
                </p>
              </div>
              <Link href="/problems" className={primary}>
                문제 고르기
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

/* ————— 내부 소형 컴포넌트 ————— */

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function DifficultyPill({ level }: { level?: string }) {
  const color =
    level === 'Easy'
      ? 'bg-green-100 text-green-700'
      : level === 'Medium'
      ? 'bg-yellow-100 text-yellow-700'
      : level === 'Hard'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
      {level ?? '—'}
    </span>
  )
}

function ProblemCard({ p }: { p: Problem }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{p.title}</h3>
        <DifficultyPill level={p.difficulty} />
      </div>
      <p className="text-sm text-gray-600 mt-1">{p.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {p.tags?.slice(0, 3).map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
          >
            #{t}
          </span>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Link
          href={`/learn/${p.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#002D56] text-white px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/90"
        >
          풀기
        </Link>
        <Link
          href={`/problems#${p.id}`}
          className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
        >
          자세히
        </Link>
      </div>
    </Card>
  )
}
```

### app/onboarding/page.tsx

```tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Onboarding() {
  const r = useRouter()
  const [level, setLevel] = useState('beginner')
  const [goal, setGoal] = useState('algorithm')

  function next() {
    const pref = { level, goal }
    localStorage.setItem('coding-sam:pref', JSON.stringify(pref))
    r.push('/home')
  }

  return (
    <div className="grid gap-6">
      <h1 className="h1">간단 설문</h1>
      <div className="card grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">실력 수준</span>
          <select className="border rounded-2xl p-2" value={level} onChange={e=>setLevel(e.target.value)}>
            <option value="beginner">입문</option>
            <option value="intermediate">중급</option>
            <option value="advanced">고급</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-gray-600">목표</span>
          <select className="border rounded-2xl p-2" value={goal} onChange={e=>setGoal(e.target.value)}>
            <option value="algorithm">알고리즘 사고</option>
            <option value="style">코드 스타일/리팩토링</option>
            <option value="system">시스템/CS 개념</option>
          </select>
        </label>
        <button className="btn-primary w-fit" onClick={next}>시작하기</button>
      </div>
    </div>
  )
}
```

### app/problems/page.tsx

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Problem = {
  id: string
  title: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | string
  tags: string[]
}

const DIFFICULTY_ORDER: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 }
const PAGE_SIZE = 6

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI 상태
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sort, setSort] = useState<'recommended' | 'difficulty' | 'title'>('recommended')
  const [visible, setVisible] = useState(PAGE_SIZE)

  useEffect(() => {
    setLoading(true)
    fetch('/api/problems')
      .then((r) => r.json())
      .then((data: Problem[]) => {
        setProblems(data)
        setLoading(false)
      })
      .catch(() => {
        setError('문제 목록을 불러오지 못했어요.')
        setLoading(false)
      })
  }, [])

  // 태그 목록(빈도순)
  const allTags = useMemo(() => {
    const freq = new Map<string, number>()
    problems.forEach((p) => p.tags?.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1)))
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t)
      .slice(0, 12)
  }, [problems])

  // 필터링
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return problems
      .filter((p) => (difficulty === 'All' ? true : p.difficulty === difficulty))
      .filter((p) => (activeTags.length ? activeTags.every((t) => p.tags?.includes(t)) : true))
      .filter((p) => {
        if (!q) return true
        const inText =
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
        return inText
      })
  }, [problems, difficulty, activeTags, query])

  // 정렬
  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (sort === 'title') {
      arr.sort((a, b) => a.title.localeCompare(b.title))
    } else if (sort === 'difficulty') {
      arr.sort((a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 99) - (DIFFICULTY_ORDER[b.difficulty] ?? 99))
    } else {
      // recommended: Medium을 위로, 그다음 Easy/Hard, 그리고 제목순
      arr.sort((a, b) => {
        const score = (x: Problem) =>
          (x.difficulty === 'Medium' ? 0 : x.difficulty === 'Easy' ? 1 : 2)
        const s = score(a) - score(b)
        return s !== 0 ? s : a.title.localeCompare(b.title)
      })
    }
    return arr
  }, [filtered, sort])

  const visibleItems = sorted.slice(0, visible)
  const hasMore = visible < sorted.length

  const resetFilters = () => {
    setQuery('')
    setDifficulty('All')
    setActiveTags([])
    setSort('recommended')
    setVisible(PAGE_SIZE)
  }

  return (
    <div className="min-h-[100svh] w-full bg-gradient-to-b from-hufs-gray/30 to-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {/* 헤더 */}
        <header className="mb-6 md:mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">문제 선택</h1>
              <p className="text-sm text-gray-600 mt-1">
                검색/필터로 빠르게 찾아보세요. 총{' '}
                <span className="font-semibold text-[#002D56]">{problems.length}</span>문제
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/home"
                className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
              >
                대시보드
              </Link>
            </div>
          </div>
        </header>

        {/* 컨트롤 바 */}
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-4 ring-1 ring-black/5 shadow-sm mb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* 검색 */}
            <div className="flex-1">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setVisible(PAGE_SIZE)
                }}
                placeholder="문제 제목, 설명, 태그 검색…"
                className="w-full rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-[#002D56]"
              />
            </div>

            {/* 난이도 */}
            <div className="flex items-center gap-2">
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((lvl) => {
                const active = difficulty === lvl
                const base = 'px-3 py-1 rounded-xl text-sm font-medium'
                return (
                  <button
                    key={lvl}
                    onClick={() => {
                      setDifficulty(lvl)
                      setVisible(PAGE_SIZE)
                    }}
                    className={
                      active
                        ? `${base} bg-[#002D56] text-white`
                        : `${base} ring-1 ring-[#002D56] text-[#002D56] hover:bg-[#002D56]/5`
                    }
                  >
                    {lvl}
                  </button>
                )
              })}
            </div>

            {/* 정렬 */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">정렬</label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any)
                  setVisible(PAGE_SIZE)
                }}
                className="rounded-xl border border-gray-300/70 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-[#002D56]"
              >
                <option value="recommended">추천순</option>
                <option value="difficulty">난이도순</option>
                <option value="title">제목순</option>
              </select>

              <button
                onClick={resetFilters}
                className="ml-1 inline-flex items-center rounded-xl bg-white text-[#002D56] ring-1 ring-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 태그 필터 */}
          {allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {allTags.map((t) => {
                const on = activeTags.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => {
                      setActiveTags((prev) =>
                        on ? prev.filter((x) => x !== t) : [...prev, t]
                      )
                      setVisible(PAGE_SIZE)
                    }}
                    className={
                      on
                        ? 'text-xs px-3 py-1 rounded-full bg-[#146E7A] text-white'
                        : 'text-xs px-3 py-1 rounded-full ring-1 ring-[#146E7A] text-[#146E7A] hover:bg-[#146E7A]/5'
                    }
                  >
                    #{t}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 콘텐츠 */}
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <ErrorBox message={error} />
        ) : sorted.length === 0 ? (
          <EmptyBox onReset={resetFilters} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleItems.map((p) => (
                <ProblemCard key={p.id} p={p} />
              ))}
            </div>

            {/* 더 보기 */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-3 px-5 font-semibold shadow-sm hover:bg-[#002D56]/5"
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* ————— 내부 컴포넌트 ————— */

function ProblemCard({ p }: { p: Problem }) {
  const pill =
    p.difficulty === 'Easy'
      ? 'bg-green-100 text-green-700'
      : p.difficulty === 'Medium'
      ? 'bg-yellow-100 text-yellow-700'
      : p.difficulty === 'Hard'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600'

  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold leading-tight">{p.title}</h3>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pill}`}>
          {p.difficulty}
        </span>
      </div>

      <p className="text-sm text-gray-600 mt-1 line-clamp-3">{p.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {p.tags?.slice(0, 4).map((t) => (
          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/learn/${p.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-[#002D56] text-white px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/90"
        >
          풀기
        </Link>
        <a
          href={`#${p.id}`}
          className="inline-flex items-center justify-center rounded-xl ring-1 ring-[#002D56] text-[#002D56] px-3 py-2 text-sm font-semibold hover:bg-[#002D56]/5"
        >
          자세히
        </a>
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-200/70 bg-white/60 backdrop-blur p-5 ring-1 ring-black/5 shadow-sm animate-pulse"
        >
          <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-full bg-gray-200 rounded mb-2" />
          <div className="h-3 w-5/6 bg-gray-200 rounded mb-4" />
          <div className="h-8 w-24 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-6">
      {message} 새로고침하거나 잠시 후 다시 시도하세요.
    </div>
  )
}

function EmptyBox({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <div className="text-xl font-semibold mb-2">조건에 맞는 문제가 없어요</div>
      <p className="text-sm text-gray-600 mb-4">검색어나 필터를 바꿔보세요.</p>
      <button
        onClick={onReset}
        className="inline-flex items-center justify-center rounded-2xl bg-white text-[#002D56] ring-2 ring-[#002D56] py-2 px-4 text-sm font-semibold hover:bg-[#002D56]/5"
      >
        필터 초기화
      </button>
    </div>
  )
}
```

### app/learn/[id]/page.tsx

```tsx
// ~/Desktop/coding-sam/app/learn/[id]/page.tsx
import LearnWizard from '../../../components/LearnWizard'
import { getProblemById } from '@/lib/problemsRepo'

export default async function Page({ params }: { params: { id: string } }) {
  const problem = await getProblemById(params.id)
  if (!problem) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold">문제를 찾을 수 없어요</h1>
        <p className="text-slate-600 mt-2">ID: {params.id}</p>
      </main>
    )
  }
  return <LearnWizard problem={problem} />
}
```

### app/api/ai/feedback/route.ts

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { openai } from '@/lib/openai'

// 우리 플로우의 5단계 (문서 기준): 이해, 분해, 패턴, 추상화, 의사코드
const StepEnum = z.enum(['understand', 'decompose', 'pattern', 'abstract', 'pseudocode'])

const BodySchema = z.object({
  step: StepEnum,
  userInput: z.string().min(1, '입력을 작성해 주세요.'),
  problem: z.object({
    id: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  // UI에서 힌트/코드제안을 누르면 mode 로 전달 (optional)
  mode: z.enum(['hint', 'code-suggest']).optional(),
})

const STEP_TITLES: Record<z.infer<typeof StepEnum>, string> = {
  understand: '문제 이해하기',
  decompose: '문제 분해하기',
  pattern: '패턴 인식하기',
  abstract: '추상화하기(입/출력/처리 흐름)',
  pseudocode: '의사코드 설계',
}

// 각 단계별로 프롬프트를 분리 (PDF 플로우 반영)
function buildPrompt(step: z.infer<typeof StepEnum>, mode: 'hint' | 'code-suggest' | undefined, userInput: string, problem: {title?: string; description?: string}) {
  const base = `
당신은 코딩 학습용 AI 튜터입니다. 우리는 코딩 방식을 총 4가지로 나눌거에요. 문제 이해, 문제 분해, 문제 패턴 인식, 문제 추상화하기입니다.
학생이 ${STEP_TITLES[step]} 단계에서 작성한 내용을 보고, ${step} 단계에만 집중해서 한국어로 간결하고 구체적인 피드백을 주세요.
- 장점 0~3개, 보완점 0~3개로 나눠 bullet로
- 현재 피드백을 바탕으로 다음 단계로 넘어갈 때 생각해봐야 할 점 1~2개
문제 정보:
${problem.title ?? ''}

${problem.description ?? ''}

학생 입력:
${userInput}
`.trim()

  if (mode === 'hint') {
    return base + `

[추가 요구] 지금 단계에 맞는 "힌트만" 제시하세요. 정답이나 완전한 코드가 아닌, 현 단계에서 사고를 확장시키는 질문/힌트 3개 내로.`
  }
  if (mode === 'code-suggest') {
    return base + `

[추가 요구] 지금까지의 피드백과 학생의 내용을을 바탕으로 "짧은 스니펫" 또는 "의사코드"를 10~20줄 내로 제안하세요.`
  }
  return base
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const { step, userInput, problem, mode } = BodySchema.parse(json)

    const prompt = buildPrompt(step, mode, userInput, problem)

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 코딩 학습을 단계적으로 코칭하는 한국어 튜터입니다.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    })

    const text = completion.choices[0]?.message?.content ?? '응답이 비어있습니다.'
    return NextResponse.json({ ok: true, step, mode, text })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ ok: false, error: err?.message ?? 'server error' }, { status: 400 })
  }
}
```

### app/api/problems/route.ts

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllProblems, getProblemById, getRecommended } from '@/lib/problemsRepo'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const recommended = searchParams.get('recommended')
  if (id) {
    const p = await getProblemById(id)
    return NextResponse.json(p)
  }
  if (recommended) {
    const p = await getRecommended()
    return NextResponse.json(p)
  }
  const list = await getAllProblems()
  return NextResponse.json(list)
}
```

### app/api/run/route.ts

```ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { language, code, stdin } = await req.json() as {language: 'python'|'c'|'java', code: string, stdin?: string}

    const langMap = { python: 'python', c: 'c', java: 'java' as const }
    const body = {
      language: langMap[language],
      version: '*',
      files: [{ name: language === 'java' ? 'Main.java' : language === 'c' ? 'main.c' : 'main.py', content: code }],
      stdin: stdin ?? '',
    }

    const r = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const j = await r.json()
    return NextResponse.json({ ok: true, result: j })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? 'run error' }, { status: 400 })
  }
}
```

### components/Checklist.tsx

```tsx
'use client'
export default function Checklist({ options, value, onChange }:{ options:string[]; value:string[]; onChange:(v:string[])=>void }){
  function toggle(opt:string){
    const has = value.includes(opt)
    onChange(has ? value.filter(v=>v!==opt) : [...value, opt])
  }
  return (
    <div className="grid gap-2">
      {options.map(o => (
        <label key={o} className="flex items-center gap-2">
          <input type="checkbox" checked={value.includes(o)} onChange={()=>toggle(o)} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )
}
```

### components/CodeEditor.tsx

```tsx
// ~/Desktop/coding-sam/components/CodeEditor.tsx
'use client'

import dynamic from 'next/dynamic'

// SSR에서 monaco가 안 돌아가므로 동적 import
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export type LanguageKey = 'python' | 'c' | 'java'

const langMap: Record<LanguageKey, string> = {
  python: 'python',
  c: 'c',
  java: 'java',
}

export default function CodeEditor({
  language,
  code,
  onChange,
}: {
  language: LanguageKey
  code: string
  onChange: (next: string) => void
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-200">
      <Monaco
        height="360px"
        language={langMap[language]}
        value={code}
        onChange={(v) => onChange(v ?? '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          automaticLayout: true,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  )
}
```

### components/CTAButtons.tsx

```tsx
export default function CTAButtons(){
    return (
      <div className="flex flex-wrap gap-3">
        <a className="btn-primary" href="/home">홈으로</a>
        <a className="btn-ghost" href="/problems">지금 풀기</a>
      </div>
    )
  }
```

### components/FeedbackPanel.tsx

```tsx
'use client'

import { useState } from 'react'

type Step = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'
type Mode = 'hint' | 'code-suggest' | undefined

const STEP_LABEL: Record<Step, string> = {
  understand: '이해',
  decompose: '분해',
  pattern: '패턴',
  abstract: '추상화',
  pseudocode: '의사코드',
}

export default function FeedbackPanel({ problem }: { problem: {id: string; title?: string; description?: string} }) {
  const [step, setStep] = useState<Step>('understand')
  const [mode, setMode] = useState<Mode>(undefined)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<string>('')

  const request = async () => {
    setLoading(true)
    setResp('')
    try {
      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, userInput: input, problem, mode }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'AI 오류')
      setResp(j.text)
    } catch (e: any) {
      setResp(`AI 서버 오류: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 p-5 md:p-6 bg-white">
      <div className="flex items-center gap-2 justify-between">
        <h3 className="text-xl font-semibold">AI 튜터 — {STEP_LABEL[step]}</h3>

        <div className="flex gap-2">
          <button
            onClick={() => setMode(undefined)}
            className={`px-3 py-1 rounded-full text-sm ${!mode ? 'bg-[#002D56] text-white' : 'bg-slate-100 text-slate-700'}`}
            title="일반 피드백"
          >
            요청
          </button>
          <button
            onClick={() => setMode('hint')}
            className={`px-3 py-1 rounded-full text-sm ${mode === 'hint' ? 'bg-[#002D56] text-white' : 'bg-slate-100 text-slate-700'}`}
            title="힌트만"
          >
            힌트
          </button>
          <button
            onClick={() => setMode('code-suggest')}
            className={`px-3 py-1 rounded-full text-sm ${mode === 'code-suggest' ? 'bg-[#002D56] text-white' : 'bg-slate-100 text-slate-700'}`}
            title="짧은 코드/의사코드 제안"
          >
            코드 제안
          </button>
        </div>
      </div>

      {/* 단계 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(STEP_LABEL) as Step[]).map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`px-3 py-1 rounded-full border ${step === s ? 'bg-[#002D56] text-white border-[#002D56]' : 'bg-white text-slate-700 border-slate-300'}`}
          >
            {STEP_LABEL[s]}
          </button>
        ))}
      </div>

      {/* 입력 */}
      <textarea
        className="mt-4 w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
        rows={5}
        placeholder="이 단계에서의 생각/요약/체크리스트/의사코드를 적어보세요."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="mt-3 flex gap-3">
        <button
          disabled={loading || !input.trim()}
          onClick={request}
          className="px-4 py-2 rounded-xl bg-[#296B75] text-white font-semibold disabled:opacity-50"
        >
          {loading ? '요청 중…' : 'AI 피드백 받기'}
        </button>
      </div>

      {/* 결과 */}
      {resp && (
        <div className="mt-4 whitespace-pre-wrap text-slate-800 leading-7">
          {resp}
        </div>
      )}
    </div>
  )
}
```

### components/LanguagePicker.tsx

```tsx
'use client'
import { useRouter } from 'next/navigation'

const langs = ['Python', 'Java', 'C', 'C++', 'JavaScript']

export default function LanguagePicker() {
  const r = useRouter()
  function choose(l: string) {
    localStorage.setItem('coding-sam:lang', l)
    r.push('/onboarding')
  }
  return (
    <div className="flex flex-wrap gap-2">
      {langs.map(l => (
        <button key={l} className="btn-ghost" onClick={() => choose(l)}>{l}</button>
      ))}
    </div>
  )
}
```

### components/LearnWizard.tsx

```tsx
// ~/Desktop/coding-sam/components/LearnWizard.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import CodeEditor, { LanguageKey } from './CodeEditor'

type Problem = {
  id: string
  title: string
  description?: string
  difficulty?: string
  tags?: string[]
  samples?: { input: string; output: string }[]
}

type StepKey = 'understand' | 'decompose' | 'pattern' | 'abstract' | 'pseudocode'

const STEP_ORDER: StepKey[] = ['understand', 'decompose', 'pattern', 'abstract', 'pseudocode']
const STEP_LABEL: Record<StepKey, string> = {
  understand: '이해',
  decompose: '분해',
  pattern: '패턴',
  abstract: '추상화',
  pseudocode: '의사코드 → 코드/실행',
}

export default function LearnWizard({ problem }: { problem: Problem }) {
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEP_ORDER[stepIdx]

  // 각 단계의 사용자 입력 상태
  const [understand, setUnderstand] = useState('')
  const [decompose, setDecompose] = useState('')
  const [pattern, setPattern] = useState('')
  const [abstractIn, setAbstractIn] = useState('입력 정의 예) n: 정수, arr: 길이 n의 정수배열')
  const [abstractOut, setAbstractOut] = useState('출력 정의 예) 최대 부분합(정수)')
  const [pseudocode, setPseudocode] = useState('')

  // 코드/러너 상태
  const [language, setLanguage] = useState<LanguageKey>('python')
  const [codeByLang, setCodeByLang] = useState<Record<LanguageKey, string>>({
    python: '',
    c: '',
    java: '',
  })
  const [stdin, setStdin] = useState('')
  const [stdout, setStdout] = useState('')

  // AI
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText] = useState('')

  // ---------- LocalStorage 로드/저장 ----------
  const codeKey = useMemo(() => `code:${problem.id}:${language}`, [problem.id, language])
  useEffect(() => {
    const saved = localStorage.getItem(codeKey)
    if (saved && !codeByLang[language]) {
      setCodeByLang((p) => ({ ...p, [language]: saved }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeKey])

  function updateCode(next: string) {
    setCodeByLang((prev) => {
      const nx = { ...prev, [language]: next }
      localStorage.setItem(codeKey, next)
      return nx
    })
  }

  // ---------- 러너 ----------
  async function run(input?: string) {
    setStdout('실행 중…')
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          code: codeByLang[language] ?? '',
          stdin: input ?? stdin,
        }),
      })
      const j = await res.json()
      if (!j.ok) {
        setStdout(`실행 오류: ${j.error}`)
      } else {
        // piston 응답 호환
        const out = j.result?.run?.output ?? j.result?.stdout ?? JSON.stringify(j.result, null, 2)
        setStdout(out)
      }
    } catch (e: any) {
      setStdout(`네트워크 오류: ${e.message ?? e}`)
    }
  }

  function runSample(i: number) {
    const s = problem.samples?.[i]
    if (!s) return
    run(s.input)
  }

  // ---------- AI ----------
  async function askAI(mode?: 'hint' | 'code-suggest') {
    setAiLoading(true)
    setAiText('')
    const userInput =
      step === 'understand' ? understand :
      step === 'decompose' ? decompose :
      step === 'pattern' ? pattern :
      step === 'abstract' ? `입력:\n${abstractIn}\n\n출력:\n${abstractOut}` :
      /* pseudocode */ pseudocode

    try {
      const r = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          userInput,
          problem: { id: problem.id, title: problem.title, description: problem.description },
          mode,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'AI 오류')
      setAiText(j.text as string)
    } catch (e: any) {
      setAiText(`AI 서버 오류: ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  // ---------- UI ----------
  const progress = ((stepIdx + 1) / STEP_ORDER.length) * 100

  return (
    <main className="max-w-7xl mx-auto px-5 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{problem.title}</h1>
          <div className="text-sm text-slate-600">{stepIdx + 1} / {STEP_ORDER.length} 단계</div>
        </div>
        <p className="text-slate-700 mt-1">{problem.description}</p>
      </div>

      {/* 프로그레스바 */}
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-[#002D56]" style={{ width: `${progress}%` }} />
      </div>

      {/* 단계 탭 미리보기 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STEP_ORDER.map((k, i) => (
          <button
            key={k}
            onClick={() => setStepIdx(i)}
            className={`px-3 py-1 rounded-full border text-sm ${
              i === stepIdx ? 'bg-[#002D56] text-white border-[#002D56]' : 'bg-white text-slate-700 border-slate-300'
            }`}
          >
            {STEP_LABEL[k]}
          </button>
        ))}
      </div>

      {/* 메인 카드 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* 좌측: 현재 단계 작성 영역 */}
        <section className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
          {step === 'understand' && (
            <>
              <h2 className="text-lg font-semibold mb-2">1) 문제 이해하기</h2>
              <p className="text-sm text-slate-600 mb-3">핵심 요구사항 / 입출력 / 제약 / 엣지케이스를 요약해보세요.</p>
              <textarea
                rows={10}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                placeholder="예) 입력은 n과 길이 n의 정수배열… 출력은 최대 부분합…"
                value={understand}
                onChange={(e) => setUnderstand(e.target.value)}
              />
            </>
          )}

          {step === 'decompose' && (
            <>
              <h2 className="text-lg font-semibold mb-2">2) 문제 분해하기</h2>
              <p className="text-sm text-slate-600 mb-3">문제를 해결 가능한 작은 하위 단계로 나눠보세요. (체크리스트)</p>
              <textarea
                rows={10}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                placeholder={`예)\n- 입력 파싱\n- 누적합/DP 점화 정리\n- 반복하면서 최댓값 갱신`}
                value={decompose}
                onChange={(e) => setDecompose(e.target.value)}
              />
            </>
          )}

          {step === 'pattern' && (
            <>
              <h2 className="text-lg font-semibold mb-2">3) 패턴 인식하기</h2>
              <p className="text-sm text-slate-600 mb-3">유사 문제/자료구조/알고리즘 패턴을 연결해보세요.</p>
              <textarea
                rows={10}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                placeholder="예) 부분합 최대 → Kadane 패턴(현재 연속합 음수면 리셋, 전역 최댓값 갱신)…"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
            </>
          )}

          {step === 'abstract' && (
            <>
              <h2 className="text-lg font-semibold mb-2">4) 추상화하기</h2>
              <p className="text-sm text-slate-600 mb-3">입력/출력/처리 흐름을 명확히 정의하세요.</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">입력 정의</label>
                  <textarea
                    rows={8}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                    value={abstractIn}
                    onChange={(e) => setAbstractIn(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">출력 정의</label>
                  <textarea
                    rows={8}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                    value={abstractOut}
                    onChange={(e) => setAbstractOut(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 'pseudocode' && (
            <>
              <h2 className="text-lg font-semibold mb-2">5) 의사코드 → 코드/실행</h2>
              <p className="text-sm text-slate-600 mb-3">먼저 의사코드를 정리한 뒤, 아래 코드 에디터에서 구현/실행해보세요.</p>
              <textarea
                rows={8}
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56] mb-4"
                placeholder={`예)\n- cur=0, best=-INF\n- 각 원소 x에 대해: cur = max(x, cur+x); best = max(best, cur)\n- best 출력`}
                value={pseudocode}
                onChange={(e) => setPseudocode(e.target.value)}
              />

              {/* 언어 탭 */}
              <div className="flex items-center gap-2 mb-2">
                {(['python','c','java'] as LanguageKey[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`px-3 py-1 rounded-full border text-sm ${
                      l === language ? 'bg-[#296B75] text-white border-[#296B75]' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
                <div className="ml-auto text-sm text-slate-500">VSCode 스타일 하이라이트</div>
              </div>

              <CodeEditor
                language={language}
                code={codeByLang[language] ?? ''}
                onChange={updateCode}
              />

              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <textarea
                  className="w-full h-32 rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-[#002D56]"
                  placeholder={`표준입력 (예: \n9\n-2 1 -3 4 -1 2 1 -5 4\n)`}
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                />
                <pre className="w-full h-32 rounded-xl border border-slate-200 p-3 bg-slate-50 overflow-auto whitespace-pre-wrap">
{stdout || '실행 결과가 여기에 표시됩니다.'}
                </pre>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <button onClick={() => run()} className="px-4 py-2 rounded-xl bg-[#002D56] text-white">내 입력 실행</button>
                {problem.samples?.map((_, i) => (
                  <button key={i} onClick={() => runSample(i)} className="px-4 py-2 rounded-xl bg-white text-[#002D56] ring-2 ring-[#002D56]">
                    예시 실행 {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* 우측: AI 피드백 카드 */}
        <aside className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6">
          <div className="flex items(center) justify-between mb-2">
            <h3 className="text-lg font-semibold">AI 튜터 — {STEP_LABEL[step]}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => askAI(undefined)}
                className="px-3 py-1 rounded-full text-sm bg-[#002D56] text-white"
              >
                요청
              </button>
              <button
                onClick={() => askAI('hint')}
                className="px-3 py-1 rounded-full text-sm bg-white border border-slate-300"
                title="힌트만"
              >
                힌트
              </button>
              <button
                onClick={() => askAI('code-suggest')}
                className="px-3 py-1 rounded-full text-sm bg-white border border-slate-300"
                title="짧은 코드/의사코드 제안"
              >
                코드 제안
              </button>
            </div>
          </div>
          <div className="text-sm text-slate-600 mb-3">
            {step === 'understand' && '핵심 요구/제약/엣지케이스를 중심으로 피드백합니다.'}
            {step === 'decompose' && '체크리스트 단위 분해가 잘 되었는지 피드백합니다.'}
            {step === 'pattern' && '유사 문제/알고리즘 패턴 연결을 돕습니다.'}
            {step === 'abstract' && '입·출력/흐름 정의의 모호함을 짚어줍니다.'}
            {step === 'pseudocode' && '의사코드를 점검하거나 간단 스니펫을 제안합니다.'}
          </div>
          <div className="min-h-[180px] whitespace-pre-wrap leading-7">
            {aiLoading ? '생성 중…' : (aiText || '오른쪽 상단 버튼으로 피드백을 요청해보세요.')}
          </div>
        </aside>
      </div>

      {/* 하단 내비게이션 */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          className="px-4 py-2 rounded-xl bg:white border border-slate-300 disabled:opacity-50"
          disabled={stepIdx === 0}
        >
          이전
        </button>
        <button
          onClick={() => setStepIdx((i) => Math.min(STEP_ORDER.length - 1, i + 1))}
          className="px-5 py-2 rounded-xl bg-[#296B75] text-white"
          disabled={stepIdx === STEP_ORDER.length - 1}
        >
          다음
        </button>
      </div>
    </main>
  )
}
```

### components/NavBar.tsx

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/home', label: '대시보드' },
  { href: '/problems', label: '문제' },
  { href: '/home#tutor', label: 'AI 튜터' },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-gray-200/80">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-[#002D56]">
          coding-sam
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {navItems.map((item) => {
            const active =
              item.href === '/home'
                ? pathname === '/home'
                : pathname.startsWith(item.href.replace(/#.*$/, ''))
            const base =
              'hover:opacity-80 transition-colors'
            const cls = active
              ? `text-[#002D56] font-semibold ${base}`
              : `text-gray-600 ${base}`
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
```

### components/ProblemIO.tsx

```tsx
'use client'
export default function ProblemIO({ value, onChange }:{ value:{input:string; output:string; flow:string}; onChange:(v:any)=>void }){
  return (
    <div className="grid gap-3">
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">[입력]</span>
        <input className="border rounded-2xl p-2" value={value.input} onChange={e=>onChange({ ...value, input: e.target.value })} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">[출력]</span>
        <input className="border rounded-2xl p-2" value={value.output} onChange={e=>onChange({ ...value, output: e.target.value })} />
      </label>
      <label className="grid gap-1">
        <span className="text-sm text-gray-600">처리 흐름</span>
        <textarea className="border rounded-2xl p-2" rows={4} value={value.flow} onChange={e=>onChange({ ...value, flow: e.target.value })}/>
      </label>
    </div>
  )
}
```

### components/QuestionList.tsx

```tsx
'use client'
export default function QuestionList({ value, onChange }:{ value: string[]; onChange:(v:string[])=>void }){
  function add() { onChange([ ...value, '' ]) }
  function edit(i:number, v:string){ const clone=[...value]; clone[i]=v; onChange(clone) }
  function remove(i:number){ const clone=[...value]; clone.splice(i,1); onChange(clone) }
  return (
    <div className="grid gap-3">
      <div className="font-semibold">나의 질문 추가</div>
      <div className="grid gap-2">
        {value.map((q,i)=> (
          <div key={i} className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 w-6">{i+1}.</span>
            <input className="flex-1 border rounded-2xl p-2" value={q} onChange={e=>edit(i,e.target.value)} />
            <button className="text-xs text-gray-500" onClick={()=>remove(i)}>삭제</button>
          </div>
        ))}
        <button className="btn-ghost w-fit" onClick={add}>질문 추가</button>
      </div>
    </div>
  )
}
```

### components/Stepper.tsx

```tsx
type Step = { key: string; label: string }
export default function Stepper({ steps, active, onChange }:{ steps: Step[]; active: number; onChange:(i:number)=>void }){
  return (
    <ol className="flex flex-wrap gap-2">
      {steps.map((s,i)=> (
        <li key={s.key}>
          <button onClick={()=>onChange(i)}
            className={`px-3 py-1 rounded-full text-sm border ${i===active? 'bg-brand-600 text-white border-brand-600':'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{i+1}. {s.label}</button>
        </li>
      ))}
    </ol>
  )}
```

### .gitignore

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.local
.env*

# Node/Next
node_modules/
.next/
out/
dist/

# Env
.env
.env.*
!.env.example
!.env.local.example

# OS/IDE
.DS_Store
.vscode/
```

### README.md

```md
# coding-sam

단계 학습이 탑재된 AI 코딩 튜터 웹앱 (로컬 3000 → EC2 단일 인스턴스 전개 용이)

## 1) 설치 & 실행
```bash
npm i
cp .env.local.example .env.local  # OPENAI_API_KEY 입력
npm run dev                       # http://localhost:3000
```

## 2) 구조 핵심
- Next.js App Router + Route Handlers(API)로 프론트·백엔드 일원화
- `/app/api/ai/feedback` : OpenAI Responses API 호출
- `/app/api/problems` : 문제 목록/추천/단건 조회 (현재 JSON, 추후 DB)

## 3) 배포(단일 EC2)
- Node 20, `npm run build && npm start` or Dockerfile 사용
- 환경변수: `OPENAI_API_KEY`, (추후) `DATABASE_URL`

## 4) 개발 메모
- UI: Tailwind. 단계: 이해→분해→패턴→추상화→의사코드
- 리포지토리 레이어로 JSON→DB 전환 최소화
```

### prisma/schema.prisma

```prisma
// 추후 Postgres 전환 시 사용
// generator client { provider = "prisma-client-js" }
// datasource db { provider = "postgresql" url = env("DATABASE_URL") }
// model Problem { id String @id @default(cuid()) title String description String difficulty String tags String[] }
```

### public assets (binary)
- public/Homepage_icon.jpg
- public/logo.svg


