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

Cognito est conservé ; le modèle Todo et son API publique de démonstration sont retirés. Aucun modèle métier backend n'est défini : les graphiques sont intégralement locaux. Ne pas déployer sur une stack contenant des données Todo à conserver sans vérifier les impacts du retrait de la ressource Data.

## Structure

- `src/App.tsx` : routes publiques.
- `src/theme/index.ts` : thème Material UI centralisé.
- `src/main.tsx` : initialisation React, MUI et Amplify.
- `amplify/` : backend Gen 2.
- `@nivo/core` et `@nivo/line` : dépendances graphiques déclarées.

## Navigation

Les pages sont accessibles sans authentification. Le backend Cognito historique reste facultatif et n'est pas utilisé pour la navigation. Le menu latéral est réduit au démarrage ; le bouton en haut permet de le déployer. La route `/ranking` contient le graphique de classement historique. `/graph-2` reste un emplacement réservé avec un sélecteur XLSX indépendant. Ajouter une page dans `src/pages/` puis une entrée dans `src/navigation/graphRoutes.tsx` suffit pour créer une nouvelle section. Pour Amplify Hosting, configurer une réécriture SPA vers `/index.html` (HTTP 200) pour les routes frontend afin que les liens directs et les actualisations fonctionnent.

## Fichiers XLSX locaux

Chaque route possède son propre cache via `src/cache/`. `/ranking` garde les données analysées en mémoire et dans `sessionStorage` (par onglet, y compris après actualisation si la place est disponible). `/graph-2` conserve son fichier brut en mémoire pendant la navigation, sans l’analyser ; une actualisation complète le perd. Aucun fichier ni calcul n’est envoyé au backend. Effacer ou remplacer un fichier ne touche que la route concernée. Les filtres de classement reviennent à leur valeur par défaut lors du retour sur la page.

Tests métier et cache : `yarn test` (Node 22.16+).
