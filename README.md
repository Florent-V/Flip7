# Scores à la voix – Flip 7 & Skyjo

Application 100 % front-end (Nuxt 3, SPA) pour gérer les scores du jeu **Flip 7**, avec reconnaissance vocale en français (Web Speech API – Chrome, Edge, Safari). Les données sont sauvegardées dans le navigateur (`localStorage`).

```bash
cd flip7
npm install
npm run dev      # http://localhost:3000
npm test         # tests du parseur vocal
npm run generate # site statique dans .output/public
```

## Règles gérées
- Score de la manche = total des cartes ; **raté (bust) = 0** ; **Flip 7 = +15**.
- Victoire dès qu'un joueur atteint l'objectif (150/200/250) à la fin d'une manche ; égalité en tête → manche supplémentaire.

## Commandes vocales
| Phrase | Effet |
|---|---|
| « Alice cartes 3 5 12, Bob 15 » | points de la manche (chiffres ou mots) |
| « Bob a raté » / « Alice et Bob ont raté » | 0 point |
| « Léa flip 7 » / « Léa 28 flip 7 » | bonus +15 |
| « ajoute 10 à Alice » | additionne |
| « efface Alice » | vide la saisie |
| « manche suivante » / « valider » | enregistre la manche |
| « annule » / « annule la dernière manche » | annulations |

Un champ texte permet de tester les mêmes commandes sans micro. Le micro exige HTTPS ou `localhost`.

## Saisie
- **Tableau** : tous les joueurs sur un écran (manches passées, manche en cours, total). Touchez un joueur pour saisir sa main.
- **Cartes** : touchez les cartes 0-12, les modificateurs +2…+10 et ×2. Un **doublon = raté** et **7 cartes différentes = Flip 7 (+15)** sont détectés automatiquement.
- Voix : « Alice cartes 3 5 12 », « Bob fois deux », en plus des commandes ci-dessus.

## Mode Skyjo
- Écran d'accueil pour choisir le jeu (chaque partie est sauvegardée séparément).
- Comptez les cartes restantes de -2 à 12 (12 cartes max), ou saisissez le total ; les scores négatifs sont gérés.
- **🏁 A fini la manche** : si le finisseur n'a pas le score *strictement* le plus bas, son score (s'il est positif) est **doublé** automatiquement.
- La partie se termine quand un joueur atteint 100 (50/100/150) ; **le moins de points gagne**.
- Voix : « Alice 12 », « Bob moins trois », « Claire 25 a fini », « manche suivante », « annule »…
