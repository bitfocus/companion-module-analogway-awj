# Details

Date : 2024-06-30 19:09:47

Directory /home/dnmeid/companion/companion/module-local-dev/companion-module-analogway-awj

Total : 54 files,  40089 codes, 3582 comments, 3114 blanks, all 46785 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [.eslintrc.js](/.eslintrc.js) | JavaScript | 11 | 0 | 1 | 12 |
| [README.md](/README.md) | Markdown | 99 | 0 | 24 | 123 |
| [build-config.cjs](/build-config.cjs) | JavaScript | 0 | 9 | 2 | 11 |
| [companion/HELP.md](/companion/HELP.md) | Markdown | 338 | 0 | 154 | 492 |
| [companion/manifest.json](/companion/manifest.json) | JSON | 34 | 0 | 0 | 34 |
| [package.json](/package.json) | JSON | 61 | 0 | 1 | 62 |
| [src/awjdevice/actions.ts](/src/awjdevice/actions.ts) | TypeScript | 2,908 | 169 | 228 | 3,305 |
| [src/awjdevice/awjdevice.ts](/src/awjdevice/awjdevice.ts) | TypeScript | 67 | 49 | 23 | 139 |
| [src/awjdevice/choices.ts](/src/awjdevice/choices.ts) | TypeScript | 1,047 | 92 | 95 | 1,234 |
| [src/awjdevice/constants.ts](/src/awjdevice/constants.ts) | TypeScript | 18 | 5 | 13 | 36 |
| [src/awjdevice/feedback.ts](/src/awjdevice/feedback.ts) | TypeScript | 1,321 | 41 | 90 | 1,452 |
| [src/awjdevice/presets.ts](/src/awjdevice/presets.ts) | TypeScript | 1,729 | 68 | 104 | 1,901 |
| [src/awjdevice/subscriptions.ts](/src/awjdevice/subscriptions.ts) | TypeScript | 877 | 369 | 86 | 1,332 |
| [src/config.ts](/src/config.ts) | TypeScript | 122 | 0 | 3 | 125 |
| [src/connection.ts](/src/connection.ts) | TypeScript | 501 | 134 | 49 | 684 |
| [src/ignore_livepremier_old/awjlivepremier.ts](/src/ignore_livepremier_old/awjlivepremier.ts) | TypeScript | 24 | 17 | 8 | 49 |
| [src/ignore_livepremier_old/livepremierActions.ts](/src/ignore_livepremier_old/livepremierActions.ts) | TypeScript | 2,336 | 111 | 98 | 2,545 |
| [src/ignore_livepremier_old/livepremierChoices.ts](/src/ignore_livepremier_old/livepremierChoices.ts) | TypeScript | 563 | 21 | 73 | 657 |
| [src/ignore_livepremier_old/livepremierFeedback.ts](/src/ignore_livepremier_old/livepremierFeedback.ts) | TypeScript | 887 | 34 | 37 | 958 |
| [src/ignore_livepremier_old/livepremierSubscriptions.ts](/src/ignore_livepremier_old/livepremierSubscriptions.ts) | TypeScript | 268 | 0 | 6 | 274 |
| [src/ignore_midra_old/midraActions.ts](/src/ignore_midra_old/midraActions.ts) | TypeScript | 2,549 | 124 | 118 | 2,791 |
| [src/ignore_midra_old/midraChoices.ts](/src/ignore_midra_old/midraChoices.ts) | TypeScript | 551 | 19 | 71 | 641 |
| [src/ignore_midra_old/midraFeedback.ts](/src/ignore_midra_old/midraFeedback.ts) | TypeScript | 1,034 | 43 | 42 | 1,119 |
| [src/ignore_midra_old/midraSubscriptions.ts](/src/ignore_midra_old/midraSubscriptions.ts) | TypeScript | 368 | 0 | 7 | 375 |
| [src/index.ts](/src/index.ts) | TypeScript | 376 | 100 | 48 | 524 |
| [src/livepremier/actions.ts](/src/livepremier/actions.ts) | TypeScript | 2,114 | 117 | 170 | 2,401 |
| [src/livepremier/choices.ts](/src/livepremier/choices.ts) | TypeScript | 976 | 73 | 89 | 1,138 |
| [src/livepremier/constants.ts](/src/livepremier/constants.ts) | TypeScript | 19 | 5 | 10 | 34 |
| [src/livepremier/feedback.ts](/src/livepremier/feedback.ts) | TypeScript | 1,302 | 42 | 88 | 1,432 |
| [src/livepremier/presets.ts](/src/livepremier/presets.ts) | TypeScript | 1,721 | 68 | 104 | 1,893 |
| [src/livepremier/subscriptions.ts](/src/livepremier/subscriptions.ts) | TypeScript | 857 | 358 | 82 | 1,297 |
| [src/livepremier4/actions.ts](/src/livepremier4/actions.ts) | TypeScript | 2,126 | 117 | 170 | 2,413 |
| [src/livepremier4/choices.ts](/src/livepremier4/choices.ts) | TypeScript | 976 | 73 | 89 | 1,138 |
| [src/livepremier4/constants.ts](/src/livepremier4/constants.ts) | TypeScript | 19 | 5 | 10 | 34 |
| [src/livepremier4/feedback.ts](/src/livepremier4/feedback.ts) | TypeScript | 1,302 | 42 | 88 | 1,432 |
| [src/livepremier4/presets.ts](/src/livepremier4/presets.ts) | TypeScript | 1,721 | 68 | 104 | 1,893 |
| [src/livepremier4/subscriptions.ts](/src/livepremier4/subscriptions.ts) | TypeScript | 857 | 358 | 82 | 1,297 |
| [src/mappings.ts](/src/mappings.ts) | TypeScript | 320 | 77 | 13 | 410 |
| [src/midra/actions.ts](/src/midra/actions.ts) | TypeScript | 2,344 | 141 | 204 | 2,689 |
| [src/midra/choices.ts](/src/midra/choices.ts) | TypeScript | 1,024 | 89 | 91 | 1,204 |
| [src/midra/constants.ts](/src/midra/constants.ts) | TypeScript | 21 | 5 | 12 | 38 |
| [src/midra/feedback.ts](/src/midra/feedback.ts) | TypeScript | 1,302 | 42 | 88 | 1,432 |
| [src/midra/presets.ts](/src/midra/presets.ts) | TypeScript | 1,721 | 68 | 104 | 1,893 |
| [src/midra/subscriptions.ts](/src/midra/subscriptions.ts) | TypeScript | 857 | 358 | 82 | 1,297 |
| [src/state.ts](/src/state.ts) | TypeScript | 268 | 51 | 21 | 340 |
| [src/upgrades.ts](/src/upgrades.ts) | TypeScript | 25 | 5 | 6 | 36 |
| [src/util.ts](/src/util.ts) | TypeScript | 55 | 0 | 13 | 68 |
| [src/variables.ts](/src/variables.ts) | TypeScript | 15 | 6 | 4 | 25 |
| [tsconfig.build.json](/tsconfig.build.json) | JSON | 15 | 0 | 1 | 16 |
| [tsconfig.preset.json](/tsconfig.preset.json) | JSON | 18 | 0 | 1 | 19 |
| [types/Device.ts](/types/Device.ts) | TypeScript | 3 | 1 | 1 | 5 |
| [types/DeviceMap.ts](/types/DeviceMap.ts) | TypeScript | 13 | 0 | 3 | 16 |
| [types/State.ts](/types/State.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [types/Subscription.ts](/types/Subscription.ts) | TypeScript | 6 | 8 | 2 | 16 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)