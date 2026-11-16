# Jacques Graphs

React 18, TypeScript strict, Vite, Material UI 7, Nivo 0.99 et AWS Amplify Gen 2.

## Démarrage

Node.js 22.16+ (ou une version LTS plus récente compatible Vite 7), Yarn Classic 1.22.22.
Vite 7 requiert Node 20.19+ ou 22.12+ ; respecter également les contraintes du backend.

```sh
yarn install
yarn dev
```

Le fichier `yarn.lock` provient du boilerplate et doit être actualisé par ce premier `yarn install`, puis commité avant tout déploiement CI (`--frozen-lockfile`). Les nouvelles dépendances n'ont pas pu être téléchargées dans l'environnement de préparation.

```sh
yarn typecheck
yarn lint
yarn build
```

## Backend (facultatif pour le développement graphique)

```sh
yarn sandbox
```

Le sandbox utilise les identifiants AWS locaux et génère `amplify_outputs.json`, ignoré par Git. Le frontend fonctionne sans ce fichier et configure Amplify lorsqu'il est présent. Redémarrer Vite après sa génération.

Cognito est conservé ; le modèle Todo et son API publique de démonstration sont retirés. Aucun nouveau modèle ni graphique métier n'est défini. Ne pas déployer sur une stack contenant des données Todo à conserver sans vérifier les impacts du retrait de la ressource Data.

## Structure

- `src/App.tsx` : page minimale.
- `src/theme/index.ts` : thème Material UI centralisé.
- `src/main.tsx` : initialisation React, MUI et Amplify.
- `amplify/` : backend Gen 2.
- `@nivo/core` et `@nivo/line` : dépendances graphiques déclarées.
