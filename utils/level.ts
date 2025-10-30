// /utils/level.ts
/**
 * 레벨 규칙: 레벨업마다 100 XP 고정
 * level: 현재 레벨(최소 1)
 * cur  : 다음 레벨까지 남은 XP
 * need : 한 레벨에 필요한 총 XP(=100)
 * pct  : 진행률(0~100, 현재 레벨에서 채운 비율)
 */

export const PER_LEVEL_XP = 100

export function xpToLevel(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp || 0))

  const level = Math.floor(xp / PER_LEVEL_XP) + 1
  const filled = xp % PER_LEVEL_XP               // 현재 레벨에서 채운 양
  let remain = PER_LEVEL_XP - filled             // 다음 레벨까지 남은 양
  if (remain === PER_LEVEL_XP) remain = 0        // 막 레벨업했을 때 0으로 표시

  const pct = Math.round((filled / PER_LEVEL_XP) * 100)

  return { level, cur: remain, need: PER_LEVEL_XP, pct }
}

/** LevelCard.tsx에서 쓰던 API 호환 */
export function getLevelFromXP(totalXp: number) {
  const { level, cur } = xpToLevel(totalXp)
  return { level, need: cur } // 'need'를 "남은 값"으로 제공
}

export function levelProgressPercent(totalXp: number) {
  return xpToLevel(totalXp).pct
}
