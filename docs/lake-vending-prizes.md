# Lake vending prize checklist

Approved: 2026-10-30. Implement locally; do not deploy or start a preview server.
Keep English and Chinese together. Preserve the five original prizes and the boss
shortcut, rowing crew, keyboard navigation, and reduced-motion behavior.

Each new prize has an illustration and an explicit use button. Draw without repeats
until the shelf is exhausted. Lake effects are temporary and reset on leaving.

| Status | ID | Prize / 物件 | Interaction / 笑点 |
| --- | --- | --- | --- |
| Done | duck | Rubber duck debugger / 橡皮鸭调试员 | Patrols between boats. Click or use the keyboard to hear seven rotating bilingual debugging quips in a speech bubble beside the duck. Each click pops a new line for 4.5 seconds, then swimming resumes automatically unless the pointer is hovering over the duck. Yields to the rowing crew, reacts to its wake, and complains before returning to patrol. 问题没解决，但湖里多了一位专家。 |
| Done | blackhole | Pocket black hole / 便携式黑洞 | Claims to absorb stress; swallows one paper boat. Fish it back with the rescue control. |
| Done | friday | Bottled Friday / 瓶装星期五 | Sky, sun, and water ease into the existing golden sunset over five seconds. 保质期：直到老板发消息。 |
| Hidden | radar | Boss radar / 老板雷达 | A red target approaches on the radar; after two seconds it is identified as a duck inside the display. Does not spawn a lake duck. |
| Hidden | letter | Schrödinger’s acceptance letter / 薛定谔的录用通知 | 默认接收，直到打开：Still under review. |
| Hidden | warmer | GPU hand warmer / GPU 暖手宝 | A steaming GPU floats on the water. 显存没有你的份，余温可以。 |
| Hidden | seed | Random seed / 随机种子 | Grows a GPU tree. Every GPU is Queued / 排队中. |
| Done | remote | Deadline remote / 截止日期遥控器 | Two snoozes move the same soft sun backward; a third request is denied because the sun has clocked out. Resetting the lake restores the quota. 仅对太阳有效。 |
| Hidden | noodles | Paper-flavored noodles / 论文味泡面 | An accelerated, explicitly labeled demo countdown keeps finding another three minutes. |
| Hidden | recycler | Rejection recycler / 拒稿信回收机 | Folds a rejection into an extra paper boat. 至少它现在能浮起来。 |
| Hidden | die | Authorship die / 作者排序骰子 | Always rolls corresponding author; the boats sprout mail. Visual only. |
| Hidden | bottle | Message from the boss / 老板的漂流瓶 | Front: 辛苦了，早点休息。 Flip: 顺便再补一个实验。 |
| Hidden | undo | Physical Ctrl+Z / 实体 Ctrl+Z 键 | Sends its own prize back into the vending machine. 刚才什么都没发生。 |
| Done | jackets | Paper life jackets / 论文救生衣 | Orange life jackets fade in over about one second with a small stagger between boats. 实验可以沉，论文不能。 |

## Initial validation (2026-10-30)

- All 19 draws and all 14 new prize interactions passed offline browser checks.
- Checked desktop (1440×1000), narrow mobile (320×568), and landscape (844×390).
- Checked timed punchlines, rescue/reset, boss pause/resume, B/Esc, and reduced motion.
- Existing lake regression passed four viewports (also 390×844), original prizes,
  rowing, keyboard editing/IME protections, preference changes, and no JavaScript.
- Jekyll build and JavaScript syntax checks passed. No preview server or deployment.

Enter via **Off the clock → Lake toys → Lab vending**, draw a prize, then use its
bilingual action button. **Esc** puts the current prize away before leaving the lake.
Toy scene cards share a compact bottom-center layout above the bottom controls.
The duck speaks in a small bubble anchored beside it instead of opening a card.
The lake hint is temporarily hidden while a card is open. Short screens use a
compact text layout with scrolling when needed.
Closing the scene card leaves its lake decoration in place; leaving the lake clears
all decorations. Opening the vending machine or boss screen pauses prize timers.

## Temporary direct controls (hidden)

**Lake toys / 湖边玩具** now contains only **Boss nearby / 老板来了**,
**Lab vending / 实验室售货机**, and **Call the rowing crew / 赛艇队来了**.
Interactive prizes can only be obtained through the vending machine. The temporary
prize trial buttons and **Reset the lake / 重置湖面** are disabled by omitting
`data-prize-shortcuts` from `#lake-toy-menu` in `_includes/after-hours-toys.html`.
The optional controls remain in the source for future local testing.
Opening the toy menu puts the current scene card away; existing lake decorations
remain until exit. Leaving the lake clears all prize effects.

Before being hidden, direct controls were checked at 1440×1000, 320×568, and 844×390: all 14
prizes, keyboard scrolling, reset, unchanged draw inventory, radar pause/resume,
and radar use with and without an existing patrol duck all passed.

## Feedback update (2026-10-31)

- Hidden from both vending and direct controls: boss message bottle (`bottle`),
  rejection recycler (`recycler`), GPU hand warmer (`warmer`), physical Ctrl+Z
  (`undo`), random seed (`seed`), Schrödinger’s acceptance (`letter`), paper-flavored
  noodles (`noodles`), authorship die (`die`), and boss radar (`radar`). Artwork and
  effects remain in the source; `enabled: false` is the single switch to restore them.
- Active interactive prizes: duck, black hole, bottled Friday, deadline remote,
  and paper life jackets. Together with the five original prizes, 10 total.
  Counts are initialized from the active catalog rather than hard-coded in markup.
- The lake uses one soft, warm-yellow sun with slightly stronger contrast. The
  deadline remote only moves it, preserving its color and diffuse edge (including
  the Friday sunset palette), with at most two larger rewind steps. A compact
  remote panel below the sky keeps the movement visible on phones. Reduced-motion
  mode applies the new position immediately; reset/exit restores its position.

Earlier checks, before the six additional prizes were hidden: the first three
hidden prizes were absent from the 11 direct buttons and two
complete 16-prize draw rounds. Sun visibility, three rewind steps, resize, Friday
palette, reset/exit, keyboard handling, and reduced motion passed at 1440×1000,
390×844, 320×568, 844×390, 640×360, and 320×390. Jekyll build passed.

## Interaction polish (2026-10-31)

- Friday uses one five-second eased color progression for the sky, sun and water.
  Reusing Friday keeps the existing transition; reset restores daylight.
- Life jackets fade in over 1.05 seconds, staggered by up to 240 ms. Both effects
  respect pause and reduced-motion settings.
- The deadline remote allows two extensions per lake visit/reset. A third request
  leaves the sun in place and displays a bilingual refusal; closing the card does
  not restore the quota.
- The duck is a keyboard-accessible button with seven rotating bilingual remarks.
  It pauses both swimming and bobbing while its speech bubble is visible, so the
  text stays still. Hovering also pauses swimming and bobbing. Once the pointer
  leaves and the bubble closes it resumes from the same position, even if keyboard
  focus remains on the duck. Touch taps do not create a lingering hover pause.
  Every click restarts the pop with the next line; it disappears after 4.5
  seconds or closes with Esc. Only one bubble is shown at a time.

Verified offline at 1440×1000, 390×844, 320×568, and 844×390: color progression,
pause/resume, reset, changing motion preference, jacket fade, extension quota,
and duck mouse/keyboard interaction. Jekyll build and JavaScript checks passed.

## Duck and rowing crew (2026-11-02)

- The crew's actual bow and stern positions trigger a warning, a quick move out of
  the lane, and two gentle rocks in its wake. The duck then says “Racing to a Nature
  deadline? / 赶着去投 Nature 啊？” for 4.5 seconds before easing back to patrol.
  On shallow screens it yields to the far side of the lane to avoid the controls.
- With 15% probability, and only when there is enough room, the duck briefly chases
  the crew before saying “Wait for me! I can be the corresponding author. /
  带我一个，我负责通讯。”
- Normal patrol still pauses on hover. A click during the warning or safety dodge
  queues its quip until the maneuver finishes; a click during the safe wake or
  chase stops the duck and speaks immediately. Speech stays beside a still duck.
  Reduced motion replaces the encounter with a static bilingual quip.
- The duck still comes only from **Lab vending**; the lake menu retains its three
  existing entries. Leaving the lake clears the encounter with the other effects.

Jekyll build, JavaScript syntax, and whitespace checks passed. Offline browser
checks passed at 1440×1000, 390×844, 320×390, and 844×390: the complete encounter,
stationary speech, smooth return, and both chase outcomes. Also verified boss and
vending pause/resume, queued safety clicks, hover/click during chase, retained
focus, repeated crews, exit cleanup, reduced motion and live preference changes.
No JavaScript errors. No preview server, commit, or deployment.
