# CAPCHA — reprise de travail (état au 2026-10-16)

Jeu de CAPTCHA à résoudre, style The Password Game (three.js, navigateur, français). Branche : `claude/captcha-game-password-style-i8u4xu`.

## Lancer
`npm install && npm start` puis http://localhost:8080 (serveur Node + ws pour le mode en ligne). Version statique : servir `public/`.
URL de debug : `?cap=<id>&cheat=1` (une manche seule), `?level=N`, `?seed=N`. Contrat technique : `docs/CONTRACT.md`.

## Décisions du joueur (à respecter)
- **Une consigne ne change JAMAIS en cours de manche** (pas de rectificatif/erratum/inversion). Les consignes s'affichent au début et restent.
- Manches équitables et faisables du premier coup sur téléphone ; calculs simples seulement.
- Bouton « Passer l'étape » : retiré. Bouton « Mode en ligne » du menu : retiré (le code en ligne existe toujours : `server/online.js`, `public/js/online/*`, mais n'est plus accessible depuis le menu).

## Les 16 manches (ordre dans `public/js/captchas/index.js`)
1 a_checkbox, 2 a_wavy (24 mots), 3 a_grid, 4 a_math (calcul simple), 5 a_slider, 6 a_bins, 7 a_order, 8 a_rotate,
9 b_flip (un animal différent par tableau), 10 b_hunt, 11 b_loading, 12 b_memory (décompte 3-2-1), 13 b_robot, 14 b_cube,
15 b_pwd (16 règles, capitale, éclosion 5 s, finit par « ! »), 16 b_boss (3 charges, calculs simples).

## Outils
`tools/layout-gate.mjs --quick` (contrôle de mise en page mobile/desktop), `tools/shot.mjs` (captures), `tools/b_test.mjs`, `tools/a_test.mjs`, `tools/balance-real.mjs`.

## À faire / idées
- Déployer sur le site de l'utilisateur (dossier `H:\Projets`, projets botané, multi branch, benchornot) et créer la tuile dans le menu du site principal : lire d'abord comment ces projets se déploient.
- Tester en vrai sur téléphone les manches 9–16 ; critiques indépendantes non refaites sur les derniers changements.
- Mode en ligne : à réactiver (bouton du menu dans `public/js/ui.js` titleScreen) quand un serveur est hébergé.
