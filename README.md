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

### Case Flow (`/sankey`)
Importe le XLSX de brevets directement dans le navigateur (première feuille possédant les en-têtes requis). Les données de ce graphique restent en mémoire pendant la navigation, et sont perdues au rechargement. Aucun envoi réseau par l'importeur. Choisir le cabinet, le type de flux et le pays. La vue inbound par pays utilise la juridiction, le pays du déposant et celui du cabinet destinataire; elle ne dépend pas de la présence d'un cabinet d'origine dans le fichier.

Les flux entre cabinets sont des rapprochements estimés par Family ID + déposant + pays du déposant. Une demande étrangère est rapprochée d'un dépôt dans le pays du déposant (ou EP pour les déposants européens) uniquement si un cabinet d'origine unique est identifiable. Les demandes sont comptées par juridiction et numéro de demande, non par publication. Les lignes incomplètes et les rapprochements ambigus sont exclus. Cette méthode ne démontre pas un véritable transfert commercial. Le fichier d'exemple est fictif. Les anciennes fonctions de la v0.4 restent présentes pour les tests historiques mais ne sont plus utilisées par l'écran.

### Sankey inbound (prototype)

Le mode **Inbound** compte les demandes nationales (ou EP) pour lesquelles un
cabinet est renseigné et le déposant est étranger au territoire concerné.
Le pays sélectionné correspond au **pays du déposant** ; le pays du cabinet
source ne peut pas toujours être établi à partir de cet export.

Lorsqu'une demande de la même famille permet d'identifier un unique cabinet
représentant dans le pays du déposant, celui-ci est affiché à gauche.
Sinon, la demande est conservée sous **« Cabinet d’origine non identifié »**.
Chaque demande est dédoublonnée par juridiction, numéro de demande et cabinet.
Ces liens sont expérimentaux : ils ne prouvent pas un transfert commercial.

## Gevers & Orès (expérimentation)

Le cabinet « Gevers & Orès » est sélectionné en priorité lorsqu'il figure dans les données importées.
Les vues Outbound et Inbound s'appuient sur le même XLSX importé **localement**.
Un fichier source donné peut contenir des relations Outbound sans aucun dossier Inbound identifiable.
Les relations Outbound sont estimées à partir du rapprochement des familles : elles ne prouvent pas un transfert commercial.
Le fichier original et les visualisations contenant des noms réels ne sont jamais inclus dans cette archive source.
