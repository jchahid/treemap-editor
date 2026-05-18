# TreeMap Editor

Une application Angular 17+ complète pour visualiser et éditer des structures de données hiérarchiques.

## Fonctionnalités
- 🌳 Arbre interactif récursif avec ajout/suppression de nœuds.
- 🎨 Trois thèmes : Clair, Sombre et Contraste Élevé.
- 💾 Persistance automatique dans le `localStorage`.
- 📤 Import/Export au format JSON.
- 🖼️ Support du contenu Texte (Rich Text basique) et Image (Upload ou URL).
- ⚡ Utilisation d'Angular Signals pour une réactivité optimale.

## Installation et Lancement

### 1. Cloner ou copier les fichiers
Assurez-vous d'avoir Node.js installé sur votre machine.

### 2. Installer les dépendances
```bash
cd treemap-editor
npm install
```

### 3. Lancer l'application
```bash
npm start
```
L'application sera accessible sur `http://localhost:4200`.

## Architecture
- **Core** : Modèles de données et services (Theme, Tree).
- **Features** : Composants fonctionnels (Toolbar, TreeView, NodeEditor).
- **Styles** : Utilisation intensive de variables CSS pour le thémage dynamique.

## Stack Technique
- Angular 17+ (Standalone Components, Signals)
- TypeScript Strict
- SCSS
- localStorage API
