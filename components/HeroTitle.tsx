'use client'
import React from 'react'

export default function HeroTitle() {
  const text = 'coding-sam'
  return (
    <h1 className="group text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
      <span className="text-gradient animate-x">
        {text.split('').map((ch, i) => (
          <span
            key={i}
            className="interactive-letter"
            style={{ transitionDelay: `${i * 35}ms` }}
            aria-hidden="true"
          >
            {ch}
          </span>
        ))}
      </span>
    </h1>
  )
}
