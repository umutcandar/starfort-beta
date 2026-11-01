/**
 * Compact hand-authored SVG silhouettes for the 14 current equipment pieces.
 * Every artifact keeps its own form, not just a recoloured generic sword/armor.
 * Decorative markup is static and never takes untrusted input.
 */
export const ITEM_GLYPHS=Object.freeze({
  starbreaker:'<path d="M32 2 39 14 35 42 29 42 25 14Z" fill="#d4e7ff" stroke="#e6b85c" stroke-width="2"/><path d="M32 6V41M15 41 27 38 32 44 37 38 49 41M32 45V64" stroke="#ffdf9a" stroke-width="3.5" fill="none"/><path d="M32 16 37 28 49 33 37 38 32 49 27 38 15 33 27 28Z" fill="#c6a3f9" opacity=".8"/>',
  ashes_plate:'<path d="M21 10 11 22 16 32 22 28 22 57 42 57 42 28 48 32 53 22 43 10 37 16H27Z" fill="#8ba6cb" stroke="#e8bb77" stroke-width="3"/><path d="M32 17 37 30 32 43 27 30Z" fill="#f6da94"/><path d="M22 33 32 41 42 33M22 47 32 53 42 47" stroke="#dbbe80" stroke-width="3" fill="none"/>',
  guardian_seal:'<path d="M17 6Q32 20 47 6" fill="none" stroke="#e4c074" stroke-width="3"/><path d="M32 15 45 25 45 45 32 59 19 45 19 25Z" fill="#1e739d" stroke="#e3c87a" stroke-width="3"/><path d="M32 19 36 32 49 36 36 40 32 53 28 40 15 36 28 32Z" fill="#c5ebff" stroke="#fff5bc" stroke-width="1.5"/>',
  iron_sword:'<path d="M32 7 38 16 35 43 29 43 26 16Z" fill="currentColor"/><path d="M32 12V41M18 42H46M27 43L25 57H39L37 43" stroke="#eee0bc" stroke-width="3" fill="none"/>',
  ward_mail:'<path d="M19 14 11 24 17 31 21 27V55H43V27L47 31 53 24 45 14 39 20H25Z" fill="currentColor"/><path d="M21 29H43M21 41H43M32 20V55M26 30 37 41M38 30 26 42" stroke="#162a3b" stroke-width="2.5" opacity=".75"/>',
  lunar_charm:'<path d="M38 9C23 15 23 38 43 42 22 51 12 27 26 14Z" fill="currentColor"/><path d="M32 40 44 49 32 62 20 49Z" fill="#c6e8ee"/><path d="M32 44V57M25 49H39" stroke="#f5e5b7" stroke-width="2"/>',
  ember_blade:'<path d="M34 5C20 15 40 20 25 32 16 42 22 48 32 46 45 42 39 31 42 24 43 15 36 12 34 5Z" fill="#e98552" opacity=".85"/><path d="M34 15 40 28 35 44 30 44 26 28Z" fill="currentColor"/><path d="M19 45H45M30 46 28 58H36L34 46" stroke="#f7dfae" stroke-width="3" fill="none"/>',
  warden_plate:'<path d="M21 8 11 19 16 34 23 29V55L32 61 41 55V29L48 34 53 19 43 8 37 18H27Z" fill="currentColor"/><path d="M23 29 32 34 41 29M23 41 32 46 41 41M32 20V60" stroke="#e9dfcb" stroke-width="2.7" fill="none"/><path d="M26 15H38L32 25Z" fill="#22334b"/>',
  star_lens:'<circle cx="32" cy="36" r="18" fill="none" stroke="currentColor" stroke-width="5"/><path d="M32 13 37 31 55 36 37 41 32 59 27 41 9 36 27 31Z" fill="#fff1bd"/><circle cx="32" cy="36" r="6" fill="currentColor"/><path d="M17 18 11 12M47 18 53 12" stroke="#e8e4fa" stroke-width="3"/>',
  royal_blade:'<path d="M32 3 39 17 35 43H29L25 17Z" fill="currentColor"/><path d="M32 7V43M19 41H45M32 45V59" stroke="#fff1cf" stroke-width="3"/><path d="M23 37 14 43 23 49 32 44 41 49 50 43 41 37" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 16 32 9 40 16" fill="none" stroke="#fff1cf" stroke-width="2"/>',
  aegis:'<path d="M32 6 52 15V33C52 46 44 56 32 62 20 56 12 46 12 33V15Z" fill="currentColor"/><path d="M32 11V56M18 24H46M20 39 32 46 44 39" stroke="#f9e8c0" stroke-width="3" fill="none"/><path d="M26 18 32 13 38 18 32 30Z" fill="#20354a"/>',
  moonheart:'<path d="M32 59C11 46 7 35 13 23 18 12 29 13 32 21 35 13 46 12 51 23 57 35 53 46 32 59Z" fill="currentColor"/><path d="M32 53 20 35 32 18 44 35Z" fill="#ccedf4"/><path d="M32 23V48M24 36H40" stroke="#fff3d2" stroke-width="2"/>',
  moon_watch:'<path d="M32 7 49 16V36C49 48 39 55 32 60 25 55 15 48 15 36V16Z" fill="#548caa"/><path d="M37 14C26 19 25 37 41 41 25 47 18 28 27 18Z" fill="#e8f2fc"/><path d="M19 21 32 15 45 21" stroke="currentColor" stroke-width="2.4" fill="none"/>',
  ember_guard:'<path d="M21 10 12 23 17 33 23 29V56H41V29L47 33 52 23 43 10 36 17H28Z" fill="#9f4c3e"/><path d="M23 30 32 37 41 30M32 37V56" stroke="#f7bd7c" stroke-width="3" fill="none"/><path d="M32 13 38 25 32 32 26 25Z" fill="#ffe09b"/>',
  dawn_relic:'<path d="M32 6V58M7 32H57M15 15 49 49M49 15 15 49" stroke="#f8e6a6" stroke-width="2.5"/><circle cx="32" cy="32" r="15" fill="currentColor"/><path d="M32 20 36 28 45 32 36 36 32 45 28 36 19 32 28 28Z" fill="#fff5d8"/><circle cx="32" cy="32" r="4" fill="#e3a851"/>',
  star_spear:'<path d="M32 4 42 20 32 35 22 20Z" fill="currentColor"/><path d="M32 17V62M25 34 32 39 39 34" stroke="#f4e7be" stroke-width="4" fill="none"/><path d="M32 8 36 20 32 26 28 20Z" fill="#b5edfa"/>',
  grave_seal:'<path d="M32 4 48 14 52 32 43 52 32 64 21 52 12 32 16 14Z" fill="#555b7d"/><path d="M32 10 37 25 51 30 37 35 32 54 27 35 13 30 27 25Z" fill="#b5d4eb"/><path d="M20 44 32 50 44 44" stroke="#d8b6fa" stroke-width="3" fill="none"/>',
  eclipse_edge:'<path d="M32 3 42 18 37 41 27 41 22 18Z" fill="#8f66b7"/><path d="M32 7V42" stroke="#f2cbe1" stroke-width="3"/><path d="M17 43 25 38 32 44 39 38 47 43 39 49 32 46 25 49Z" fill="#473258" stroke="#e8bb94" stroke-width="2"/><path d="M30 47V63H34V47" fill="#c8a26f"/>',
  dawn_guard:'<path d="M32 5 54 15 48 44 32 62 16 44 10 15Z" fill="currentColor"/><path d="M32 13V55M17 23 32 31 47 23M21 44 32 50 43 44" stroke="#fff1c5" stroke-width="3" fill="none"/><path d="M32 17 38 27 32 35 26 27Z" fill="#d38d52"/>',
});
export function armoryArt(item){
  const palette={common:'#8dbac2',epic:'#b99adf',legendary:'#edc47a'};
  const color=item?.set==='moon'?'#9fd3ed':item?.set==='ember'?'#e8a179':item?.set==='dawn'?'#edcf8a':palette[item?.rarity]||'#9ab5c1';
  const glyph=ITEM_GLYPHS[item?.id]||ITEM_GLYPHS.iron_sword;
  return `<svg class="item-art" viewBox="0 0 64 68" aria-hidden="true" style="color:${color}"><circle cx="32" cy="34" r="29" fill="currentColor" opacity=".07"/><circle cx="32" cy="34" r="28" stroke="currentColor" stroke-width="1.5" opacity=".42" fill="none"/>${glyph}</svg>`;
}
