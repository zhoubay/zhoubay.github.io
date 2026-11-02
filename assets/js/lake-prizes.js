/* Local, bilingual lake-vending prizes. Artwork contains no text or external assets. */
window.LakePrizes = [
  {
    id: "duck",
    icon: "duck",
    en: "A debugging duck",
    zh: "橡皮鸭调试专家",
    detailEn: "Very attentive. Currently booked for a lake patrol.",
    detailZh: "认真听你讲完 bug，然后决定先巡湖一圈。",
    actionEn: "Send on patrol",
    actionZh: "请专家巡湖",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <ellipse cx="61" cy="74" rx="39" ry="7" fill="#c7dfd6" stroke="none"/>
      <path d="M23 73c7-4 11 4 18 0m43 0c6-4 11 3 16 0" stroke="#7fa9a1"/>
      <path d="M78 46c14 1 16 17 1 23-17 7-41 2-47-10L22 45l18 6c6-10 15-12 23-10-5-7-3-18 9-20 13-2 22 10 15 20Z" fill="#efc86e"/>
      <path d="m85 33 13 6-14 5" fill="#dc8c59"/>
      <path d="M48 53c8-2 15 2 20 8-11 6-21 0-20-8Z" fill="#f7dda0" stroke="#c39a4f"/>
      <circle cx="70" cy="33" r="5" fill="#fff5d9"/>
      <circle cx="81" cy="33" r="5" fill="#fff5d9"/>
      <path d="M75 33h1m-11-1-5-1"/>
      <circle cx="71" cy="33" r="1.4" fill="#34575c" stroke="none"/>
      <circle cx="82" cy="33" r="1.4" fill="#34575c" stroke="none"/>
      </svg>`
  },
  {
    id: "blackhole",
    icon: "blackhole",
    en: "A pocket black hole",
    zh: "口袋黑洞",
    detailEn: "Fits your stress. And, possibly, one paper.",
    detailZh: "装得下压力，也可能顺手装走一篇论文。",
    actionEn: "Feed it some stress",
    actionZh: "投喂一点压力",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <circle cx="61" cy="45" r="30" fill="#dce9e1" stroke="none"/>
      <path d="M24 23v8m-4-4h8m65 33v8m-4-4h8" stroke="#a5bdb0"/>
      <circle cx="61" cy="45" r="23" fill="#294a54"/>
      <circle cx="61" cy="45" r="15" fill="#1d343f" stroke="none"/>
      <ellipse cx="61" cy="45" rx="44" ry="11" transform="rotate(-19 61 45)" stroke="#d4a85b" stroke-width="5"/>
      <path d="M21 58c12 6 35 1 52-6 16-6 27-13 27-18" stroke="#f4d892" stroke-width="3"/>
      <path d="m83 14 19 6-9 12-3-10Z" fill="#fff9e8"/>
      <path d="m90 22 12-2M24 42l7-2m-12 8 10-2" stroke="#7fa59f"/>
      <circle cx="39" cy="15" r="2" fill="#dfaf65" stroke="none"/>
      </svg>`
  },
  {
    id: "friday",
    icon: "friday",
    en: "Bottled Friday",
    zh: "瓶装星期五",
    detailEn: "Uncork whenever the week has lasted long enough.",
    detailZh: "周几不重要，拧开就是周五傍晚。",
    actionEn: "Uncork Friday",
    actionZh: "拧开星期五",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M50 19h20v13l12 13v25a7 7 0 0 1-7 7H45a7 7 0 0 1-7-7V45l12-13Z" fill="#d5e9dd"/>
      <path d="M39 49c12-4 30 4 42 0v21a6 6 0 0 1-6 6H45a6 6 0 0 1-6-6Z" fill="#e9ad78" stroke="none"/>
      <circle cx="60" cy="49" r="12" fill="#f7d57f" stroke="none"/>
      <path d="M42 58h36m-30 7h24m-20 5h16" stroke="#bd795d" opacity=".65"/>
      <rect x="49" y="9" width="22" height="12" rx="3" fill="#c8a274"/>
      <path d="M54 12v5m12-5v5M48 42l7-8v-7" stroke="#fff8e9" stroke-width="3"/>
      <path d="M91 27v8m-4-4h8m-66 8v6m-3-3h6" stroke="#d4ab60"/>
      <path d="M49 24h22" stroke="#81a99d"/>
      </svg>`
  },
  {
    id: "radar",
    enabled: false,
    icon: "radar",
    en: "A boss radar",
    zh: "老板雷达",
    detailEn: "Detects approaching danger. Occasionally, a duck.",
    detailZh: "侦测正在靠近的老板，也可能把鸭子算进去。",
    actionEn: "Scan the lake",
    actionZh: "扫描一下湖面",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="m42 70-6 8m42-8 6 8" stroke-width="4"/>
      <circle cx="60" cy="44" r="31" fill="#365a5d"/>
      <circle cx="60" cy="44" r="25" fill="#b7d5bd" stroke="#e3efcf" stroke-width="1.5"/>
      <circle cx="60" cy="44" r="16" stroke="#7eac91" stroke-width="1.5"/>
      <circle cx="60" cy="44" r="7" stroke="#7eac91" stroke-width="1.5"/>
      <path d="M60 20v48M36 44h48" stroke="#7eac91" stroke-width="1"/>
      <path d="M60 44V20a24 24 0 0 1 22 14Z" fill="#f1d78a" stroke="none" opacity=".8"/>
      <path d="m60 44 20-13" stroke="#f5e8ab" stroke-width="3"/>
      <circle cx="60" cy="44" r="3" fill="#34575c" stroke="none"/>
      <path d="M80 34c-2-5 2-9 6-8 4 1 5 6 2 8 5 1 6 7 1 10-5 3-13 1-15-4l-3-5 8 2Z" fill="#edc56a" stroke-width="1.5"/>
      <path d="m89 30 6 2-6 2" fill="#dd9567" stroke-width="1.5"/>
      <circle cx="86" cy="30" r="1" fill="#34575c" stroke="none"/>
      </svg>`
  },
  {
    id: "letter",
    enabled: false,
    icon: "letter",
    en: "Schrödinger’s acceptance",
    zh: "薛定谔的录用信",
    detailEn: "An exciting decision, safely hidden inside an envelope.",
    detailZh: "没拆之前，处于录用与拒稿的叠加态。",
    actionEn: "Open the letter",
    actionZh: "拆开看看",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="m25 36 35-23 35 23v35a5 5 0 0 1-5 5H30a5 5 0 0 1-5-5Z" fill="#d0e0d5"/>
      <path d="M38 25h44v40H38Z" fill="#fff9e9"/>
      <path d="M47 34h26m-26 8h20" stroke="#a7bdb2"/>
      <path d="m25 36 35 24 35-24v35a5 5 0 0 1-5 5H30a5 5 0 0 1-5-5Z" fill="#f2dfb3"/>
      <path d="m26 72 23-19m45 19L71 53" stroke="#c3ab7d"/>
      <circle cx="60" cy="58" r="12" fill="#d58d67" stroke="#af765d"/>
      <path d="M55 51h10m-10 14h10m-9-13c0 5 8 6 8 12m0-12c0 5-8 6-8 12" stroke="#fff3d9" stroke-width="1.6"/>
      <path d="M19 23v7m-3.5-3.5h7m74-12v6m-3-3h6" stroke="#c4a967"/>
      </svg>`
  },
  {
    id: "warmer",
    enabled: false,
    icon: "warmer",
    en: "A GPU hand warmer",
    zh: "GPU 暖手宝",
    detailEn: "Your hands are about to outperform the heating budget.",
    detailZh: "算力没有，热量管够。先把手训练暖和。",
    actionEn: "Warm things up",
    actionZh: "暖一暖手",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M41 31c-8-8 8-11 1-20m18 20c-8-8 8-11 1-20m18 20c-8-8 8-11 1-20" stroke="#d8a16e" opacity=".8"/>
      <rect x="23" y="38" width="74" height="32" rx="5" fill="#7eaaa1"/>
      <path d="M20 35v39m-4-36h4m-4 33h4" stroke="#34575c" stroke-width="3"/>
      <path d="M35 70v7h29v-7" fill="#e8c779"/>
      <path d="M42 72v5m7-5v5m7-5v5" stroke="#b18a50" stroke-width="1.5"/>
      <circle cx="49" cy="54" r="12" fill="#e7ead6"/>
      <path d="M49 43c8 5 7 8 0 11 7 1 10 5 6 10-6 1-8-3-6-10-4 6-9 6-11 0 1-6 6-7 11 0" fill="#a5c4af" stroke-width="1.3"/>
      <circle cx="49" cy="54" r="3" fill="#36585c" stroke="none"/>
      <path d="M73 46h15m-15 7h15m-15 7h10" stroke="#d8e7ce" stroke-width="3"/>
      <circle cx="90" cy="65" r="2" fill="#ebaf70" stroke="none"/>
      </svg>`
  },
  {
    id: "seed",
    enabled: false,
    icon: "seed",
    en: "A random seed",
    zh: "一颗随机种子",
    detailEn: "Guaranteed to sprout. Available compute sold separately.",
    detailZh: "保证发芽。长出来的 GPU，不保证有空位。",
    actionEn: "Plant the seed",
    actionZh: "种下这颗种子",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M60 63V25m0 28L39 37m21 11 22-12" stroke="#70927e" stroke-width="3"/>
      <path d="M47 63h26l-4 15H51Z" fill="#d4936b"/>
      <rect x="44" y="59" width="32" height="7" rx="2" fill="#e6b182"/>
      <g transform="rotate(-18 36 30)"><rect x="23" y="22" width="26" height="17" rx="3" fill="#9dc5ac"/><circle cx="35" cy="30" r="5" fill="#e9e6b8"/><path d="M30 39v4m6-4v4m6-4v4" stroke="#bf9856" stroke-width="2"/></g>
      <g transform="rotate(17 84 29)"><rect x="71" y="21" width="26" height="17" rx="3" fill="#9dc5ac"/><circle cx="83" cy="29" r="5" fill="#e9e6b8"/><path d="M77 38v4m6-4v4m6-4v4" stroke="#bf9856" stroke-width="2"/></g>
      <rect x="48" y="8" width="24" height="17" rx="3" fill="#b2cfb3"/>
      <circle cx="60" cy="16" r="5" fill="#f3dd9b"/>
      <path d="M58 13h4m-4 6h4m-3-5 2 4m0-4-2 4" stroke-width="1"/>
      <path d="M31 54c-8 0-12-5-11-11 8 0 13 5 11 11Z" fill="#c4d8b7" stroke="#8caf96"/>
      </svg>`
  },
  {
    id: "remote",
    icon: "remote",
    en: "A deadline remote",
    zh: "Deadline 遥控器",
    detailEn: "One button promises more time. The sun looks nervous.",
    detailZh: "按下就能延长今天。至于截止日期，它没答应。",
    actionEn: "Buy a little time",
    actionZh: "给今天续个钟",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <circle cx="25" cy="29" r="10" fill="#edc474" stroke="#c59d59"/>
      <path d="M25 13v-4m-16 20H5m8-12-3-3m27 3 3-3" stroke="#d9b46c"/>
      <path d="M24 43h11m-7 5h12" stroke="#b6cbb9"/>
      <g transform="rotate(13 63 45)"><rect x="46" y="13" width="34" height="65" rx="9" fill="#e8ecdc"/>
      <rect x="52" y="20" width="22" height="16" rx="3" fill="#81a79c" stroke="#638b83"/>
      <path d="M57 29c5-5 8-5 12 0" stroke="#f0d483"/>
      <circle cx="63" cy="48" r="7" fill="#db9b6d"/>
      <path d="M63 43v5m-3-3a4 4 0 1 0 6 0" stroke="#fff4da" stroke-width="1.4"/>
      <circle cx="57" cy="63" r="2" fill="#83a69b" stroke="none"/><circle cx="69" cy="63" r="2" fill="#83a69b" stroke="none"/>
      <path d="M57 70h12" stroke="#b6c8b4"/></g>
      <path d="M85 14c5 2 8 6 8 11m-6-17c9 3 14 10 14 18" stroke="#91b7aa"/>
      <circle cx="97" cy="63" r="10" fill="#f5e7c8"/>
      <path d="M97 57v6l5 3" stroke-width="1.5"/>
      </svg>`
  },
  {
    id: "noodles",
    enabled: false,
    icon: "noodles",
    en: "Paper-flavored noodles",
    zh: "论文味泡面",
    detailEn: "Ready in three minutes. Approximately. Repeatedly.",
    detailZh: "再等三分钟就好。这句话可以重复很多次。",
    actionEn: "Start the timer",
    actionZh: "开始计时",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M31 36h58L80 73a6 6 0 0 1-6 5H46a6 6 0 0 1-6-5Z" fill="#e4aa7b"/>
      <path d="m35 48 6 23c12 6 26 6 38 0l6-23Z" fill="#f6e4be" stroke="none"/>
      <ellipse cx="60" cy="36" rx="29" ry="9" fill="#eace91"/>
      <path d="M41 35c5-6 9 6 14 0s10 6 15 0 9 3 10 1" stroke="#fff3c8" stroke-width="3"/>
      <path d="m62 37 20-25m-13 27 19-24" stroke="#8a7359" stroke-width="3"/>
      <path d="M68 29c-6 2 2 7-4 10s1 7-5 10m15-19c-6 2 2 7-3 10" stroke="#e9cb86" stroke-width="2.5"/>
      <path d="M32 24c-5-5 5-7 1-12m12 11c-5-5 5-7 1-12" stroke="#9dbab0"/>
      <path d="m48 60 12-12 12 12m-29 0 17 4 17-4-7 9H50Z" fill="#fffaf0" stroke="#8fa99d" stroke-width="1.4"/>
      <path d="M60 48v16" stroke="#b7c7b4" stroke-width="1.2"/>
      </svg>`
  },
  {
    id: "recycler",
    enabled: false,
    icon: "recycler",
    en: "A rejection recycler",
    zh: "拒稿信回收站",
    detailEn: "Your rejection has excellent folding potential.",
    detailZh: "拒稿意见先不看，这张纸很适合折船。",
    actionEn: "Fold a fresh start",
    actionZh: "折成一艘新船",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M35 34h49l-4 41H39Z" fill="#8bb3a2"/>
      <rect x="31" y="29" width="57" height="8" rx="3" fill="#bad2ba"/>
      <path d="M49 29v-5h22v5" stroke="#5f8f82"/>
      <g transform="rotate(14 65 20)"><path d="M46 6h37v24H46Z" fill="#fff3d8"/><path d="m46 6 18 14L83 6" stroke="#bca47b"/><path d="m60 16 8 8m0-8-8 8" stroke="#c38266" stroke-width="2.5"/></g>
      <path d="m59 44 6 9h-6m6 0 3-6M71 58l-5 8-3-5m3 5 6-1M54 66l-5-9 6 1m-6-1-2 5" stroke="#edf1d9" stroke-width="2.5"/>
      <path d="m83 68 11-14 12 14m-30 0 18 5 18-5-8 12H84Z" fill="#fff8e6" stroke="#597f79" stroke-width="1.5"/>
      <path d="M94 54v19" stroke="#a5b8a8" stroke-width="1.2"/>
      </svg>`
  },
  {
    id: "die",
    enabled: false,
    icon: "die",
    en: "An authorship die",
    zh: "作者顺序骰子",
    detailEn: "A fair roll. Suspiciously many responsibilities.",
    detailZh: "公平随机，童叟无欺。责任总会落到你身上。",
    actionEn: "Roll for your role",
    actionZh: "掷一下，看看身份",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="m59 12 29 17v33L59 79 30 62V29Z" fill="#f4e7c5"/>
      <path d="m30 29 29 17v33L30 62Z" fill="#e1b575"/>
      <path d="m59 46 29-17v33L59 79Z" fill="#8db2a2"/>
      <path d="m30 29 29 17 29-17M59 46v33"/>
      <ellipse cx="59" cy="29" rx="5" ry="3" fill="#597770" stroke="none"/>
      <ellipse cx="40" cy="43" rx="3" ry="4" transform="rotate(-30 40 43)" fill="#6e705c" stroke="none"/>
      <ellipse cx="49" cy="63" rx="3" ry="4" transform="rotate(-30 49 63)" fill="#6e705c" stroke="none"/>
      <ellipse cx="79" cy="42" rx="3" ry="4" transform="rotate(30 79 42)" fill="#f4efd4" stroke="none"/>
      <ellipse cx="73" cy="53" rx="3" ry="4" transform="rotate(30 73 53)" fill="#f4efd4" stroke="none"/>
      <ellipse cx="67" cy="65" rx="3" ry="4" transform="rotate(30 67 65)" fill="#f4efd4" stroke="none"/>
      <rect x="84" y="65" width="26" height="17" rx="2" fill="#fff7df" stroke-width="1.5"/>
      <path d="m85 66 12 9 12-9" stroke="#b2956d" stroke-width="1.5"/>
      <path d="m18 25 3-6m73-5 4 4" stroke="#b8cdb6"/>
      </svg>`
  },
  {
    id: "bottle",
    enabled: false,
    icon: "bottle",
    en: "A message from the boss",
    zh: "老板的漂流瓶",
    detailEn: "Looks like permission to rest. There is a second sentence.",
    detailZh: "好像是让你早点休息。先别高兴，还有下一句。",
    actionEn: "Read the message",
    actionZh: "捞起来读一读",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M20 74c8-5 12 4 20 0s12 4 20 0 12 4 20 0 12 4 20 0" stroke="#90b7ad"/>
      <g transform="rotate(15 60 43)"><path d="M51 19h18v13l10 10v27a7 7 0 0 1-7 7H48a7 7 0 0 1-7-7V42l10-10Z" fill="#c8dfd4"/>
      <rect x="50" y="9" width="20" height="12" rx="3" fill="#c39f71"/>
      <path d="M48 39h24v27H48Z" fill="#fff2d2" stroke="#b9a480"/>
      <path d="M48 39c0-5 7-5 7 0m17 27c0 5-7 5-7 0" stroke="#b9a480"/>
      <circle cx="56" cy="49" r="3.5" fill="#f5dfb5"/>
      <circle cx="65" cy="49" r="3.5" fill="#f5dfb5"/>
      <path d="M60 49h1m-8-2-1-2m16 2 1-2M53 58h14m-12 4h10" stroke-width="1.2"/>
      <path d="M45 44v16m10-36v7" stroke="#f9fff1" stroke-width="2.5"/>
      </g><path d="M89 34v7m-3.5-3.5h7" stroke="#cbaa68"/>
      <circle cx="26" cy="56" r="3" fill="#d4e5d7" stroke="none"/>
      </svg>`
  },
  {
    id: "undo",
    enabled: false,
    icon: "undo",
    en: "A physical Ctrl+Z",
    zh: "实体 Ctrl+Z",
    detailEn: "A chance to reconsider. Even the prize itself.",
    detailZh: "后悔药暂时缺货，撤回键还有一个。",
    actionEn: "Undo this prize",
    actionZh: "撤回这次抽奖",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="M28 35h64v31a9 9 0 0 1-9 9H37a9 9 0 0 1-9-9Z" fill="#c6b58b"/>
      <rect x="25" y="23" width="70" height="44" rx="11" fill="#f5e9cc"/>
      <rect x="31" y="28" width="58" height="33" rx="7" fill="#fffae9" stroke="#d9cba8" stroke-width="1.2"/>
      <path d="M46 40h18a11 11 0 0 1 0 22h-6" stroke="#739e91" stroke-width="4"/>
      <path d="m49 33-8 7 8 7" stroke="#739e91" stroke-width="4"/>
      <path d="m17 20-4-5m4 21h-7m93-16 4-5m-4 21h7" stroke="#c9ae70"/>
      <path d="M39 71h41" stroke="#a49370" stroke-width="1.5"/>
      </svg>`
  },
  {
    id: "jackets",
    icon: "jackets",
    en: "Paper life jackets",
    zh: "论文救生衣",
    detailEn: "A little extra buoyancy for your very important paperwork.",
    detailZh: "给重要论文穿上橙色保护，先平安靠岸。",
    actionEn: "Suit up the boats",
    actionZh: "给小船穿上",
    art: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" fill="none" stroke="#34575c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <ellipse cx="60" cy="80" rx="38" ry="5" fill="#294f57" opacity=".09" stroke="none"/>
      <path d="m27 61 10-12 11 12m-27 0 16 4 16-4-7 11H28Z" fill="#fff8e5" stroke="#8fab9e" stroke-width="1.4"/>
      <path d="M37 49v16" stroke="#b0c3ae" stroke-width="1.2"/>
      <path d="m46 21 9-6c0 12 10 12 10 0l9 6 8 21-9 4v29H47V46l-9-4Z" fill="#df9567"/>
      <path d="M55 15c0 8 2 13 5 16 3-3 5-8 5-16" stroke="#fff0cc" stroke-width="3"/>
      <path d="M60 32v42" stroke="#a96550"/>
      <path d="M46 48h28v7H46Z" fill="#f3d082" stroke="#bd8558" stroke-width="1.5"/>
      <rect x="56" y="47" width="8" height="9" rx="1.5" fill="#f6e7bb" stroke="#7b715b" stroke-width="1.3"/>
      <path d="m48 28-4 12m28-12 4 12M51 61v7m18-7v7" stroke="#f3bb7e" stroke-width="3"/>
      <path d="m81 70 10-12 11 12m-27 0 16 4 16-4-7 11H82Z" fill="#fff8e5" stroke="#668d83" stroke-width="1.4"/>
      <path d="M91 58v16" stroke="#a4baaa" stroke-width="1.2"/>
      </svg>`
  }
];
