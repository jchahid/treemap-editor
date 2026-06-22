#!/usr/bin/env python3
"""Génère la spécification technique complète de TreeMap Editor en PDF."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import datetime

OUTPUT = "/Users/chahid/Desktop/treemap-editor/Specification_Technique_TreeMapEditor.pdf"
DATE = "30 mai 2026"
VERSION = "2.0.0"

# ── Couleurs ──────────────────────────────────────────────────────────────────
INDIGO      = colors.HexColor("#4F46E5")
INDIGO_LIGHT= colors.HexColor("#EEF2FF")
INDIGO_MID  = colors.HexColor("#6366F1")
GRAY_900    = colors.HexColor("#111827")
GRAY_700    = colors.HexColor("#374151")
GRAY_500    = colors.HexColor("#6B7280")
GRAY_200    = colors.HexColor("#E5E7EB")
GRAY_100    = colors.HexColor("#F3F4F6")
GREEN       = colors.HexColor("#059669")
ORANGE      = colors.HexColor("#D97706")
RED         = colors.HexColor("#DC2626")
WHITE       = colors.white

W, H = A4

# ── Styles ────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def s(name, **kw):
    return ParagraphStyle(name, **kw)

TITLE_MAIN = s("TitleMain",
    fontName="Helvetica-Bold", fontSize=28, leading=34,
    textColor=WHITE, alignment=TA_CENTER, spaceAfter=6)

TITLE_SUB = s("TitleSub",
    fontName="Helvetica", fontSize=13, leading=18,
    textColor=colors.HexColor("#C7D2FE"), alignment=TA_CENTER, spaceAfter=4)

TITLE_META = s("TitleMeta",
    fontName="Helvetica", fontSize=10, leading=14,
    textColor=colors.HexColor("#A5B4FC"), alignment=TA_CENTER)

H1 = s("H1",
    fontName="Helvetica-Bold", fontSize=16, leading=22,
    textColor=INDIGO, spaceBefore=18, spaceAfter=8,
    borderPad=4)

H2 = s("H2",
    fontName="Helvetica-Bold", fontSize=13, leading=18,
    textColor=GRAY_900, spaceBefore=14, spaceAfter=6)

H3 = s("H3",
    fontName="Helvetica-Bold", fontSize=11, leading=15,
    textColor=GRAY_700, spaceBefore=10, spaceAfter=4)

BODY = s("Body",
    fontName="Helvetica", fontSize=10, leading=15,
    textColor=GRAY_700, alignment=TA_JUSTIFY, spaceAfter=6)

BODY_SMALL = s("BodySmall",
    fontName="Helvetica", fontSize=9, leading=13,
    textColor=GRAY_500, spaceAfter=4)

BULLET = s("Bullet",
    fontName="Helvetica", fontSize=10, leading=14,
    textColor=GRAY_700, leftIndent=14, bulletIndent=4,
    spaceAfter=3)

CODE = s("Code",
    fontName="Courier", fontSize=9, leading=13,
    textColor=colors.HexColor("#1E1E1E"),
    backColor=GRAY_100, leftIndent=10, rightIndent=10,
    borderPad=6, spaceAfter=6)

CAPTION = s("Caption",
    fontName="Helvetica-Oblique", fontSize=9, leading=12,
    textColor=GRAY_500, alignment=TA_CENTER, spaceAfter=8)

NOTE_BOX = s("NoteBox",
    fontName="Helvetica", fontSize=10, leading=14,
    textColor=colors.HexColor("#1E3A5F"),
    backColor=colors.HexColor("#DBEAFE"),
    borderPad=8, spaceAfter=8)

WARN_BOX = s("WarnBox",
    fontName="Helvetica", fontSize=10, leading=14,
    textColor=colors.HexColor("#7C2D12"),
    backColor=colors.HexColor("#FFF7ED"),
    borderPad=8, spaceAfter=8)

# ── Header / Footer ───────────────────────────────────────────────────────────
def header_footer(canvas, doc):
    canvas.saveState()
    # Header bar
    canvas.setFillColor(INDIGO)
    canvas.rect(0, H - 28, W, 28, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(WHITE)
    canvas.drawString(1.5*cm, H - 19, "SPÉCIFICATION TECHNIQUE — TreeMap Editor v2.0")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(W - 1.5*cm, H - 19, DATE)
    # Footer
    canvas.setFillColor(GRAY_200)
    canvas.rect(0, 0, W, 20, fill=1, stroke=0)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRAY_500)
    canvas.drawString(1.5*cm, 6, "Confidentiel — Usage interne")
    canvas.drawRightString(W - 1.5*cm, 6, f"Page {doc.page}")
    canvas.restoreState()

# ── Table helper ──────────────────────────────────────────────────────────────
def styled_table(data, col_widths, header=True):
    ts = [
        ("FONTNAME",   (0, 0), (-1, 0 if header else -1), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, -1), 9),
        ("LEADING",    (0, 0), (-1, -1), 13),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [GRAY_100, WHITE]),
        ("TEXTCOLOR",  (0, 0), (-1, -1), GRAY_700),
        ("GRID",       (0, 0), (-1, -1), 0.4, GRAY_200),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
    ]
    if header:
        ts += [
            ("BACKGROUND",  (0, 0), (-1, 0), INDIGO),
            ("TEXTCOLOR",   (0, 0), (-1, 0), WHITE),
            ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    t.setStyle(TableStyle(ts))
    return t

def pill(text, bg=INDIGO_LIGHT, fg=INDIGO):
    return Paragraph(f'<font color="#{fg.hexval()[2:]}"><b>{text}</b></font>',
                     ParagraphStyle("pill", fontName="Helvetica-Bold", fontSize=9,
                                    backColor=bg, leftIndent=4, rightIndent=4, spaceAfter=0))

# ── Section separator ─────────────────────────────────────────────────────────
def section_hr():
    return HRFlowable(width="100%", thickness=1, color=INDIGO_LIGHT, spaceAfter=8)

# ── Cover page ────────────────────────────────────────────────────────────────
def cover_page():
    items = []
    # Big indigo header block simulated as a table
    cover_data = [[
        Paragraph("TreeMap Editor", TITLE_MAIN),
    ]]
    cover_table = Table(cover_data, colWidths=[W - 4*cm])
    cover_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), INDIGO),
        ("TOPPADDING", (0,0), (-1,-1), 40),
        ("BOTTOMPADDING", (0,0), (-1,-1), 40),
        ("LEFTPADDING", (0,0), (-1,-1), 20),
        ("RIGHTPADDING", (0,0), (-1,-1), 20),
        ("ROUNDEDCORNERS", [8,8,8,8]),
    ]))
    items.append(Spacer(1, 1.5*cm))
    items.append(cover_table)
    items.append(Spacer(1, 0.6*cm))
    items.append(Paragraph("Spécification Technique Complète", TITLE_SUB))
    items.append(Paragraph(f"Version {VERSION}  ·  {DATE}  ·  Angular 17 + Firebase", TITLE_META))
    items.append(Spacer(1, 1*cm))

    meta = [
        ["Projet",    "TreeMap Editor"],
        ["Version",   VERSION],
        ["Date",      DATE],
        ["Auteur",    "Équipe développement"],
        ["Stack",     "Angular 17 · Firebase 12 · Electron 28 · TailwindCSS 3"],
        ["Déploiement", "Netlify (Web)  ·  Electron (Desktop Windows)"],
        ["Statut",    "Production"],
    ]
    t = styled_table(
        [["Propriété", "Valeur"]] + meta,
        [4.5*cm, W - 4*cm - 4.5*cm - 2*cm],
        header=True
    )
    items.append(t)
    items.append(Spacer(1, 1*cm))

    items.append(Paragraph(
        "Ce document constitue la référence technique unique de l'application TreeMap Editor. "
        "Il décrit l'architecture logicielle, les modèles de données, les services, les composants, "
        "les flux d'authentification, la persistance des données et les considérations de déploiement.",
        BODY
    ))
    items.append(PageBreak())
    return items

# ── Table of contents ─────────────────────────────────────────────────────────
def toc():
    items = []
    items.append(Paragraph("Table des matières", H1))
    items.append(section_hr())
    toc_entries = [
        ("1", "Contexte et objectifs", "3"),
        ("2", "Architecture générale", "4"),
        ("3", "Stack technologique", "5"),
        ("4", "Structure du projet", "6"),
        ("5", "Modèles de données", "7"),
        ("6", "Services Angular", "9"),
        ("7", "Composants", "12"),
        ("8", "Routage et guards", "15"),
        ("9", "Authentification", "16"),
        ("10", "Persistance et synchronisation", "17"),
        ("11", "Gestion des thèmes", "18"),
        ("12", "Export / Import", "19"),
        ("13", "Mode impression PDF", "19"),
        ("14", "Déploiement", "20"),
        ("15", "Sécurité", "21"),
        ("16", "Performances", "22"),
        ("17", "Contraintes et limitations connues", "22"),
        ("18", "Évolutions futures", "23"),
    ]
    toc_data = [["§", "Section", "Page"]]
    for num, title, page in toc_entries:
        toc_data.append([num, title, page])
    t = styled_table(toc_data, [1*cm, W - 4*cm - 1*cm - 1.5*cm, 1.5*cm])
    items.append(t)
    items.append(PageBreak())
    return items

# ── Content ───────────────────────────────────────────────────────────────────
def content():
    items = []

    # ─────────────────────────────────────────────────────────────────
    # 1. Contexte et objectifs
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("1. Contexte et objectifs", H1))
    items.append(section_hr())

    items.append(Paragraph("1.1 Présentation du produit", H2))
    items.append(Paragraph(
        "TreeMap Editor est une application de cartographie hiérarchique (mind-map / tree-map) "
        "permettant à des équipes de créer, organiser et partager des structures arborescentes "
        "enrichies. Chaque nœud peut contenir du texte enrichi, des images, des listes de "
        "tâches (check-list) ou des blocs de code. Des métadonnées financières et temporelles "
        "(prix, jours, numéro de ticket) permettent de transformer l'outil en support de chiffrage "
        "ou de planning.", BODY))

    items.append(Paragraph("1.2 Objectifs fonctionnels", H2))
    goals = [
        "Créer et gérer plusieurs TreeMaps (projets) depuis un tableau de bord centralisé.",
        "Éditer les nœuds de manière riche : titre, ticket, prix, jours, contenu multi-type.",
        "Organiser les nœuds par glisser-déposer ou via les contrôles de l'arbre.",
        "Synchroniser les données cross-device via Firebase Firestore (utilisateurs Google).",
        "Permettre un accès hors-ligne en mode invité avec persistance locale (localStorage).",
        "Exporter les TreeMaps en JSON et imprimer en PDF via le navigateur.",
        "Offrir trois thèmes visuels : Clair, Sombre, Contraste élevé.",
        "Fonctionner en application web (Netlify) et en application desktop (Electron/Windows).",
    ]
    for g in goals:
        items.append(Paragraph(f"• {g}", BULLET))

    items.append(Paragraph("1.3 Utilisateurs cibles", H2))
    users_data = [
        ["Profil", "Besoin principal"],
        ["Chef de projet", "Chiffrage, planning, suivi tickets"],
        ["Développeur", "Documentation d'architecture, notes de code"],
        ["Designer / UX", "Arbre d'information, zoning"],
        ["Consultant", "Cartographie processus, livrables client"],
    ]
    items.append(styled_table(users_data, [5*cm, W - 4*cm - 5*cm]))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 2. Architecture générale
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("2. Architecture générale", H1))
    items.append(section_hr())

    items.append(Paragraph(
        "L'application suit une architecture SPA (Single Page Application) Angular à base de "
        "composants autonomes (standalone components). Elle est découplée en couches distinctes "
        "selon le pattern Feature-Core-Shared.", BODY))

    items.append(Paragraph("2.1 Vue d'ensemble", H2))
    arch_data = [
        ["Couche", "Description", "Technologies"],
        ["Présentation", "Composants UI, templates, styles encapsulés", "Angular 17, TailwindCSS, CSS custom"],
        ["Services (Core)", "Logique métier, état réactif, I/O", "Angular Signals, RxJS, Firebase SDK"],
        ["Modèles", "Interfaces TypeScript typées", "TypeScript 5.2"],
        ["Persistance Web", "Firestore (Google) / localStorage (invité)", "Firebase Firestore v12"],
        ["Persistance Desktop", "IPC Electron → OAuth → Firebase", "Electron 28, Node.js"],
        ["Déploiement Web", "Build Angular → CDN Netlify", "Angular CLI, Netlify"],
        ["Déploiement Desktop", "Electron Builder → binaire portable", "electron-builder 24"],
    ]
    items.append(styled_table(arch_data, [3.5*cm, 6.5*cm, W - 4*cm - 3.5*cm - 6.5*cm]))

    items.append(Paragraph("2.2 Diagramme de flux principal", H2))
    items.append(Paragraph(
        "Le flux général de l'application suit le schéma ci-dessous :", BODY))

    flow = [
        ["Étape", "Acteur / Composant", "Action"],
        ["1", "LoginComponent", "L'utilisateur choisit Google ou Invité"],
        ["2", "AuthService", "Firebase Auth (web popup) ou IPC Electron (PKCE)"],
        ["3", "AuthGuard", "Vérifie isLoggedIn() → redirige vers /dashboard"],
        ["4", "DashboardComponent", "Charge la liste via TreeMapListService"],
        ["5", "TreeMapListService", "Abonnement Firestore (Google) ou localStorage (invité)"],
        ["6", "EditorShellComponent", "L'utilisateur édite un TreeMap (route /editor/:id)"],
        ["7", "TreeService", "Mutations de l'arbre via Angular Signals"],
        ["8", "Auto-save", "Debounce 500 ms → localStorage + Firestore (si Google)"],
        ["9", "PrintView / Export", "window.print() ou exportJson()"],
    ]
    items.append(styled_table(flow, [1*cm, 5*cm, W - 4*cm - 1*cm - 5*cm]))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 3. Stack technologique
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("3. Stack technologique", H1))
    items.append(section_hr())

    stack_data = [
        ["Technologie", "Version", "Rôle"],
        ["Angular",          "17.x",  "Framework frontend SPA"],
        ["TypeScript",       "5.2.x", "Langage principal"],
        ["Firebase SDK",     "12.x",  "Auth Google + Firestore (cloud sync)"],
        ["RxJS",             "7.8.x", "Gestion des flux réactifs (toObservable)"],
        ["TailwindCSS",      "3.4.x", "Utilitaires CSS (config personnalisée)"],
        ["Electron",         "28.x",  "Packaging desktop Windows"],
        ["electron-builder", "24.x",  "Création du binaire portable"],
        ["Zone.js",          "0.14.x","Détection de changement Angular"],
        ["Node.js",          "≥18",   "Runtime build + scripts set-env"],
        ["Netlify",          "—",     "CDN + redirects SPA (netlify.toml)"],
    ]
    items.append(styled_table(stack_data, [3.5*cm, 2.5*cm, W - 4*cm - 3.5*cm - 2.5*cm]))

    items.append(Paragraph("3.1 Justifications des choix", H2))
    choices = [
        ("Angular Signals", "Réactivité fine-grained sans zone.js overhead. Remplace OnPush + async pipe pour la gestion d'état."),
        ("Firebase Firestore", "Base NoSQL temps-réel, parfaitement alignée sur la structure JSON arborescente des TreeMaps."),
        ("Electron + IPC PKCE", "Contournement de la restriction Chrome des popups OAuth dans les WebViews Electron. Flux sécurisé via preload.js sandboxé."),
        ("Standalone Components", "Architecture Angular 17 sans NgModule : lazy-loading explicite, tree-shaking optimisé."),
        ("localStorage (mode invité)", "Zéro dépendance réseau pour les utilisateurs non authentifiés ; données chiffrables côté client si besoin futur."),
    ]
    for tech, reason in choices:
        items.append(Paragraph(f"<b>{tech} :</b> {reason}", BODY))

    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 4. Structure du projet
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("4. Structure du projet", H1))
    items.append(section_hr())

    items.append(Paragraph(
        "L'arborescence source respecte la convention Angular feature-based avec un dossier "
        "<b>core</b> pour les services/modèles/guards partagés et un dossier <b>features</b> "
        "pour les vues.", BODY))

    tree_text = (
        "treemap-editor/\n"
        "├── src/\n"
        "│   ├── main.ts                    # Bootstrap Angular\n"
        "│   ├── styles.scss                # Variables CSS globales (thèmes)\n"
        "│   ├── environments/\n"
        "│   │   ├── environment.ts         # Config Firebase (dev)\n"
        "│   │   └── environment.prod.ts    # Config Firebase (prod)\n"
        "│   └── app/\n"
        "│       ├── app.component.ts       # Root component (<router-outlet>)\n"
        "│       ├── app.routes.ts          # Définition des routes\n"
        "│       ├── core/\n"
        "│       │   ├── models/\n"
        "│       │   │   ├── tree-node.model.ts   # TreeNode, TaskItem, TreeDocument\n"
        "│       │   │   └── treemap.model.ts     # TreeMapMeta, TreeMapDocument\n"
        "│       │   ├── services/\n"
        "│       │   │   ├── auth.service.ts\n"
        "│       │   │   ├── tree.service.ts\n"
        "│       │   │   ├── treemap-list.service.ts\n"
        "│       │   │   └── theme.service.ts\n"
        "│       │   └── guards/\n"
        "│       │       └── auth.guard.ts\n"
        "│       └── features/\n"
        "│           ├── auth/login/login.component.ts\n"
        "│           ├── dashboard/\n"
        "│           │   ├── dashboard.component.ts\n"
        "│           │   └── treemap-card/treemap-card.component.ts\n"
        "│           ├── editor-shell/editor-shell.component.ts\n"
        "│           ├── toolbar/toolbar.component.ts\n"
        "│           ├── tree-view/\n"
        "│           │   ├── tree-view.component.ts\n"
        "│           │   └── node/node.component.ts\n"
        "│           ├── node-editor/node-editor.component.ts\n"
        "│           └── print-view/print-view.component.ts\n"
        "├── main.js                        # Electron main process\n"
        "├── preload.js                     # Electron preload (IPC bridge)\n"
        "├── auth-preload.js                # OAuth popup Electron\n"
        "├── scripts/set-env.js             # Injection des variables d'env\n"
        "├── tailwind.config.js\n"
        "├── angular.json\n"
        "└── netlify.toml                   # Redirects SPA Netlify"
    )
    items.append(Paragraph(tree_text.replace("\n", "<br/>"), CODE))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 5. Modèles de données
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("5. Modèles de données", H1))
    items.append(section_hr())

    items.append(Paragraph("5.1 TreeNode", H2))
    items.append(Paragraph(
        "Unité de base de la structure arborescente. Chaque nœud est auto-contenu et "
        "référence ses enfants directement (arbre n-aire).", BODY))

    node_fields = [
        ["Champ", "Type", "Req.", "Description"],
        ["id",            "string (UUID)",                     "✓", "Identifiant unique généré par crypto.randomUUID()"],
        ["title",         "string",                            "✓", "Libellé affiché du nœud"],
        ["contentType",   "'text'|'image'|'tasks'|'code'",     "✓", "Type de contenu du nœud"],
        ["content",       "string",                            "✓", "HTML (text), URL/base64 (image), code source"],
        ["children",      "TreeNode[]",                        "✓", "Nœuds enfants (récursif)"],
        ["expanded",      "boolean",                           "✓", "État déplié/replié dans l'arbre"],
        ["createdAt",     "string (ISO 8601)",                 "✓", "Horodatage de création"],
        ["ticketNumber",  "string?",                           "—", "Référence ticket (ex : TK-123)"],
        ["price",         "number?",                           "—", "Coût en euros"],
        ["days",          "number?",                           "—", "Charge en jours"],
        ["showPrice",     "boolean?",                          "—", "Visibilité du prix dans l'arbre"],
        ["showDays",      "boolean?",                          "—", "Visibilité des jours dans l'arbre"],
        ["showDescription","boolean?",                         "—", "Visibilité de la description"],
        ["tasks",         "TaskItem[]?",                       "—", "Liste de tâches (contentType=tasks)"],
        ["codeLanguage",  "string?",                           "—", "Langage du bloc de code"],
        ["codeExpanded",  "boolean?",                          "—", "Bloc de code déplié par défaut"],
    ]
    items.append(styled_table(node_fields, [3*cm, 4.5*cm, 1*cm, W - 4*cm - 3*cm - 4.5*cm - 1*cm]))

    items.append(Paragraph("5.2 TaskItem", H2))
    task_fields = [
        ["Champ", "Type", "Description"],
        ["id",        "string (UUID)", "Identifiant unique de la tâche"],
        ["label",     "string",        "Texte de la tâche"],
        ["completed", "boolean",       "État coché/non coché"],
    ]
    items.append(styled_table(task_fields, [3*cm, 4*cm, W - 4*cm - 3*cm - 4*cm]))

    items.append(Paragraph("5.3 TreeDocument", H2))
    items.append(Paragraph(
        "Enveloppe d'un document TreeMap (contient la racine de l'arbre).", BODY))
    doc_fields = [
        ["Champ", "Type", "Description"],
        ["id",        "string (UUID)",      "Identifiant du document"],
        ["name",      "string",             "Nom affiché du document"],
        ["root",      "TreeNode",           "Nœud racine de l'arbre"],
        ["updatedAt", "string (ISO 8601)",  "Dernière modification"],
    ]
    items.append(styled_table(doc_fields, [3*cm, 4*cm, W - 4*cm - 3*cm - 4*cm]))

    items.append(Paragraph("5.4 TreeMapMeta & TreeMapDocument", H2))
    items.append(Paragraph(
        "Métadonnées d'un projet TreeMap stockées dans la liste du dashboard.", BODY))
    meta_fields = [
        ["Champ", "Type", "Description"],
        ["id",        "string (UUID)",                      "Identifiant du projet"],
        ["title",     "string",                             "Titre du projet"],
        ["status",    "'en-cours'|'terminé'|'brouillon'",   "Statut du projet"],
        ["createdAt", "string (ISO 8601)",                  "Date de création"],
        ["updatedAt", "string (ISO 8601)",                  "Dernière modification"],
        ["data",      "TreeDocument",                       "Structure complète (TreeMapDocument uniquement)"],
    ]
    items.append(styled_table(meta_fields, [3*cm, 4.5*cm, W - 4*cm - 3*cm - 4.5*cm]))

    items.append(Paragraph("5.5 Schéma JSON stocké dans Firestore", H2))
    items.append(Paragraph(
        "Chemin Firestore : <b>users/{uid}/treemaps/{treemapId}</b>. "
        "La totalité du TreeMapDocument (métadonnées + arbre) est stockée dans un seul document "
        "Firestore. La limite de taille Firestore est de 1 Mo par document.", BODY))
    items.append(Paragraph(
        "⚠️ Pour des arbres très volumineux (> 500 nœuds), une décomposition "
        "en sous-collections sera nécessaire.", WARN_BOX))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 6. Services Angular
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("6. Services Angular", H1))
    items.append(section_hr())

    # 6.1 TreeService
    items.append(Paragraph("6.1 TreeService", H2))
    items.append(Paragraph(
        "Service central de l'éditeur. Gère l'état réactif du document courant via Angular Signals "
        "et orchestre toutes les mutations de l'arbre.", BODY))

    items.append(Paragraph("État interne", H3))
    tree_state = [
        ["Signal / Computed", "Type", "Description"],
        ["document (privé)", "signal<TreeDocument>", "Document courant (source de vérité)"],
        ["doc",              "computed<TreeDocument>","Exposition lecture seule du document"],
        ["root",             "computed<TreeNode>",    "Nœud racine du document"],
        ["selectedNodeId",   "signal<string|null>",  "ID du nœud sélectionné pour édition"],
        ["selectedNode",     "computed<TreeNode|null>","Nœud sélectionné (lookup O(n))"],
    ]
    items.append(styled_table(tree_state, [4*cm, 4.5*cm, W - 4*cm - 4*cm - 4.5*cm]))

    items.append(Paragraph("API publique", H3))
    tree_api = [
        ["Méthode", "Signature", "Description"],
        ["loadDocument",      "loadDocument(doc: TreeDocument): void",     "Charge un document (reset selection)"],
        ["addNode",           "addNode(parentId: string): void",            "Ajoute un enfant au parent donné"],
        ["removeNode",        "removeNode(id: string): void",               "Supprime un nœud (sauf racine)"],
        ["updateNode",        "updateNode(id, updates): void",              "Mise à jour partielle d'un nœud"],
        ["moveNode",          "moveNode(nodeId, targetParentId): void",     "Déplace un nœud (avec anti-cycle)"],
        ["updateDocumentName","updateDocumentName(name: string): void",     "Renomme le document"],
        ["getNodeTotals",     "getNodeTotals(node): {totalPrice, totalDays}","Agrège prix et jours récursivement"],
        ["toggleExpand",      "toggleExpand(id: string): void",             "Bascule l'état déplié/replié"],
        ["toggleTask",        "toggleTask(nodeId, taskId): void",           "Coche/décoche une tâche"],
        ["toggleCodeExpand",  "toggleCodeExpand(nodeId): void",             "Bascule le bloc de code"],
        ["exportJson",        "exportJson(): void",                         "Télécharge le document en JSON"],
        ["importJson",        "importJson(json: string): void",             "Charge un document depuis JSON"],
        ["resetDocument",     "resetDocument(): void",                      "Réinitialise (confirmation)"],
    ]
    items.append(styled_table(tree_api, [4*cm, 5.5*cm, W - 4*cm - 4*cm - 5.5*cm]))

    items.append(Paragraph("Auto-save", H3))
    items.append(Paragraph(
        "Un <b>effect()</b> Angular écoute chaque mutation du signal <i>document</i> "
        "et émet sur un <i>Subject</i> RxJS. Un opérateur <i>debounceTime(500)</i> "
        "limite les écritures localStorage à une toutes les 500 ms.", BODY))

    # 6.2 AuthService
    items.append(Paragraph("6.2 AuthService", H2))
    items.append(Paragraph(
        "Gère l'identité de l'utilisateur. Supporte deux modes : Google OAuth et Invité. "
        "Fonctionne en mode Web (signInWithPopup) et Desktop Electron (IPC + PKCE).", BODY))

    auth_state = [
        ["Signal / Computed", "Type", "Description"],
        ["user (privé)",  "signal<AuthUser|null>", "Utilisateur connecté ou null"],
        ["loading",       "signal<boolean>",        "Indicateur de chargement OAuth"],
        ["isLoggedIn",    "computed<boolean>",       "true si user() !== null"],
    ]
    items.append(styled_table(auth_state, [4*cm, 4.5*cm, W - 4*cm - 4*cm - 4.5*cm]))

    auth_api = [
        ["Méthode", "Description"],
        ["loginWithGoogle()", "Déclenche OAuth (popup web ou IPC Electron). Persiste dans localStorage."],
        ["loginAsGuest()",    "Crée un utilisateur invité local (id: 'guest-{UUID}')."],
        ["logout()",          "Supprime l'utilisateur et appelle signOut Firebase si Google."],
    ]
    items.append(styled_table(auth_api, [5*cm, W - 4*cm - 5*cm]))

    items.append(Paragraph(
        "ℹ️ La persistance est gérée via localStorage (clé treemap-auth-user) pour survivre "
        "aux rechargements de page sans nouvelle requête Firebase.", NOTE_BOX))

    # 6.3 TreeMapListService
    items.append(Paragraph("6.3 TreeMapListService", H2))
    items.append(Paragraph(
        "Orchestre la liste des projets TreeMap. Commute automatiquement entre "
        "Firestore (utilisateurs Google) et localStorage (invités) selon le signal "
        "auth.user() via toObservable().", BODY))

    list_computed = [
        ["Computed", "Description"],
        ["treemaps",    "Liste complète des TreeMapDocument"],
        ["loading",     "true pendant la première connexion Firestore"],
        ["syncError",   "Message d'erreur Firestore (null si ok)"],
        ["total",       "Nombre total de TreeMaps"],
        ["inProgress",  "Nombre de TreeMaps en statut 'en-cours'"],
        ["completed",   "Nombre de TreeMaps en statut 'terminé'"],
    ]
    items.append(styled_table(list_computed, [4*cm, W - 4*cm - 4*cm]))

    items.append(Paragraph("Stratégie optimiste", H3))
    items.append(Paragraph(
        "Les opérations <b>create</b> et <b>update</b> appliquent d'abord la mutation "
        "localement (signal mis à jour immédiatement) puis persistent en arrière-plan "
        "(Firestore ou localStorage). L'UI reste toujours réactive.", BODY))

    # 6.4 ThemeService
    items.append(Paragraph("6.4 ThemeService", H2))
    items.append(Paragraph(
        "Gère le thème visuel de l'application. Persiste en localStorage et applique "
        "l'attribut <i>data-theme</i> sur <i>document.documentElement</i>.", BODY))
    themes = [
        ["Thème", "Valeur", "Description"],
        ["Clair",           "light",          "Thème par défaut, fond blanc"],
        ["Sombre",          "dark",           "Fond foncé, texte clair"],
        ["Contraste élevé", "high-contrast",  "Noir/blanc maximal pour accessibilité"],
    ]
    items.append(styled_table(themes, [3.5*cm, 3.5*cm, W - 4*cm - 3.5*cm - 3.5*cm]))
    items.append(Paragraph(
        "La détection initiale utilise <i>window.matchMedia('(prefers-color-scheme: dark)')</i> "
        "si aucune préférence n'est sauvegardée.", BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 7. Composants
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("7. Composants", H1))
    items.append(section_hr())

    comps = [
        ("LoginComponent",        "app/features/auth/login/",           "Page de connexion (Google + Invité)"),
        ("DashboardComponent",    "app/features/dashboard/",            "Tableau de bord des projets"),
        ("TreemapCardComponent",  "app/features/dashboard/treemap-card/","Carte d'un projet dans la grille"),
        ("EditorShellComponent",  "app/features/editor-shell/",         "Coquille de l'éditeur (layout principal)"),
        ("ToolbarComponent",      "app/features/toolbar/",              "Barre d'outils (import/export/print/thème)"),
        ("TreeViewComponent",     "app/features/tree-view/",            "Vue arborescente (liste des nœuds)"),
        ("NodeComponent",         "app/features/tree-view/node/",       "Rendu récursif d'un nœud"),
        ("NodeEditorComponent",   "app/features/node-editor/",          "Panneau d'édition latéral"),
        ("PrintViewComponent",    "app/features/print-view/",           "Vue d'impression (visible uniquement @media print)"),
    ]
    comp_data = [["Composant", "Chemin", "Rôle"]]
    comp_data += [[c, p, r] for c, p, r in comps]
    items.append(styled_table(comp_data, [4.5*cm, 5*cm, W - 4*cm - 4.5*cm - 5*cm]))

    items.append(Paragraph("7.1 LoginComponent", H2))
    items.append(Paragraph(
        "Page d'accueil avant authentification. Propose deux actions : connexion Google "
        "(signInWithPopup ou IPC Electron) et mode invité (loginAsGuest). "
        "Affiche les erreurs Firebase traduites en français via translateFirebaseError.", BODY))

    items.append(Paragraph("7.2 DashboardComponent", H2))
    items.append(Paragraph(
        "Vue principale post-authentification. Fonctionnalités :", BODY))
    dash_features = [
        "Statistiques en temps réel (total / en-cours / terminés) via computed().",
        "Barre de recherche filtrante (insensible à la casse) sur les titres.",
        "Grille responsive de cartes TreemapCard.",
        "Modal de création : saisie du titre → create() → navigation vers l'éditeur.",
        "Bandeau d'erreur Firestore si syncError() est défini.",
        "Bouton de déconnexion avec redirection vers /login.",
    ]
    for f in dash_features:
        items.append(Paragraph(f"• {f}", BULLET))

    items.append(Paragraph("7.3 EditorShellComponent", H2))
    items.append(Paragraph(
        "Conteneur de l'éditeur. Chargé via la route /editor/:id. Lit l'ID depuis "
        "ActivatedRoute, charge le TreeMapDocument via TreeMapListService.getById(), "
        "puis appelle TreeService.loadDocument(). "
        "Sauvegarde automatiquement à la destruction (ngOnDestroy) et au retour dashboard.", BODY))

    items.append(Paragraph("Sous-composants de l'éditeur", H3))
    editor_layout = [
        ["Zone", "Composant", "Description"],
        ["Back bar",    "EditorShellComponent", "Retour dashboard + titre + sélecteur de statut"],
        ["Toolbar",     "ToolbarComponent",      "Import/Export JSON, Print, Reset, Thème"],
        ["Zone gauche", "TreeViewComponent",     "Arbre de nœuds avec expand/collapse et drag"],
        ["Zone droite", "NodeEditorComponent",   "Panneau latéral d'édition (400px, glissant)"],
        ["Overlay",     "PrintViewComponent",    "Contenu visible uniquement à l'impression"],
    ]
    items.append(styled_table(editor_layout, [2.5*cm, 4.5*cm, W - 4*cm - 2.5*cm - 4.5*cm]))

    items.append(Paragraph("7.4 NodeEditorComponent", H2))
    items.append(Paragraph(
        "Panneau latéral d'édition. S'ouvre (width: 400px) quand selectedNodeId() est défini. "
        "Utilise un <b>tempNode</b> (copie locale) pour l'édition optimiste : les modifications "
        "ne sont propagées au TreeService qu'au clic sur « Sauvegarder ».", BODY))

    editor_content_types = [
        ["Type", "Éditeur", "Stockage"],
        ["text",   "contenteditable div + toolbar (Bold/Italic/Underline/Listes)", "HTML string dans content"],
        ["tasks",  "Liste dynamique de TaskItem avec checkbox + input texte",       "Tableau tasks[]"],
        ["code",   "textarea monospace + sélecteur de langage",                    "Chaîne brute dans content"],
        ["image",  "Input URL + zone de drop pour upload local (FileReader → base64)", "URL ou data URI dans content"],
    ]
    items.append(styled_table(editor_content_types, [2*cm, 7*cm, W - 4*cm - 2*cm - 7*cm]))

    items.append(Paragraph("7.5 PrintViewComponent", H2))
    items.append(Paragraph(
        "Rendu hiérarchique de l'arbre sous forme de document imprimable. "
        "Caché en affichage normal (display: none) et visible uniquement via @media print. "
        "La profondeur détermine le niveau de titre (h2 → h5). "
        "Les métadonnées (ticket, prix, jours) sont affichées si présentes.", BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 8. Routage et guards
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("8. Routage et guards", H1))
    items.append(section_hr())

    routes_data = [
        ["Route", "Composant", "Guard", "Description"],
        ["/",             "—",                     "—",          "Redirect → /dashboard"],
        ["/login",        "LoginComponent",         "guestGuard", "Accessible uniquement si non connecté"],
        ["/dashboard",    "DashboardComponent",     "authGuard",  "Accessible uniquement si connecté"],
        ["/editor/:id",   "EditorShellComponent",   "authGuard",  "Éditeur d'un TreeMap spécifique"],
        ["/**",           "—",                     "—",          "Redirect → /dashboard"],
    ]
    items.append(styled_table(routes_data, [3.5*cm, 4.5*cm, 2.5*cm, W - 4*cm - 3.5*cm - 4.5*cm - 2.5*cm]))

    items.append(Paragraph("8.1 Guards", H2))
    guards_data = [
        ["Guard", "Condition d'activation", "Redirection si refus"],
        ["authGuard",  "auth.isLoggedIn() === true",  "/login"],
        ["guestGuard", "auth.isLoggedIn() === false", "/dashboard"],
    ]
    items.append(styled_table(guards_data, [3*cm, 5*cm, W - 4*cm - 3*cm - 5*cm]))
    items.append(Paragraph(
        "Les composants sont chargés en lazy-loading (loadComponent) pour optimiser "
        "le bundle initial.", BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 9. Authentification
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("9. Authentification", H1))
    items.append(section_hr())

    items.append(Paragraph("9.1 Flux Web (Navigateur)", H2))
    web_flow = [
        "Clic « Se connecter avec Gmail » → loginWithGoogle().",
        "Détection contexte : isElectron() = false → loginWeb().",
        "signInWithPopup(firebaseAuth, GoogleAuthProvider) → popup Google.",
        "Firebase retourne UserCredential → mapFirebaseUser() → _persist().",
        "Signal _user mis à jour → isLoggedIn() = true → AuthGuard laisse passer.",
        "Router.navigate(['/dashboard']).",
    ]
    for i, s_text in enumerate(web_flow, 1):
        items.append(Paragraph(f"{i}. {s_text}", BULLET))

    items.append(Paragraph("9.2 Flux Desktop (Electron)", H2))
    electron_flow = [
        "Clic « Se connecter avec Gmail » → loginWithGoogle().",
        "Détection contexte : isElectron() = true (window.ipcRenderer présent).",
        "loginElectron() : ipc.invoke('google-oauth', { clientId }) → main.js.",
        "Electron ouvre une fenêtre BrowserWindow dédiée (auth-preload.js).",
        "Flux PKCE : authorization_code → échange token → { idToken, accessToken }.",
        "Retour via IPC → signInWithCredential(firebaseAuth, GoogleAuthProvider.credential(...)).",
        "Même suite que le flux Web.",
    ]
    for i, s_text in enumerate(electron_flow, 1):
        items.append(Paragraph(f"{i}. {s_text}", BULLET))

    items.append(Paragraph("9.3 Mode Invité", H2))
    items.append(Paragraph(
        "loginAsGuest() crée un AuthUser local avec provider='guest' et un id préfixé 'guest-'. "
        "Aucun appel Firebase. Données persistées uniquement en localStorage. "
        "La synchronisation Firestore est désactivée.", BODY))

    items.append(Paragraph("9.4 Persistance de session", H2))
    items.append(Paragraph(
        "L'utilisateur est sérialisé en JSON dans localStorage (clé : treemap-auth-user). "
        "Au démarrage, AuthService lit cette clé dans loadUser(). "
        "onAuthStateChanged Firebase met à jour le signal si la session Firebase est toujours valide.", BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 10. Persistance et synchronisation
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("10. Persistance et synchronisation", H1))
    items.append(section_hr())

    persist_data = [
        ["Donnée", "Clé localStorage", "Firestore path", "Mode"],
        ["Utilisateur courant",  "treemap-auth-user",   "—",                          "Toujours localStorage"],
        ["Document en cours",    "treemap-editor-data", "—",                          "Toujours localStorage"],
        ["Liste TreeMaps (invité)", "treemap-list-guest", "—",                        "localStorage uniquement"],
        ["Liste TreeMaps (Google)", "—",               "users/{uid}/treemaps/{id}",   "Firestore (temps réel)"],
        ["Thème",                "treemap-editor-theme","—",                          "Toujours localStorage"],
    ]
    items.append(styled_table(persist_data, [3.5*cm, 4*cm, 5*cm, W - 4*cm - 3.5*cm - 4*cm - 5*cm]))

    items.append(Paragraph("10.1 Stratégie Firestore", H2))
    items.append(Paragraph(
        "TreeMapListService utilise <b>onSnapshot()</b> pour un abonnement temps-réel "
        "sur la sous-collection <i>users/{uid}/treemaps</i>, triée par updatedAt DESC. "
        "Les écritures utilisent <b>setDoc()</b> (merge total). "
        "Les suppressions utilisent <b>deleteDoc()</b>. "
        "Les erreurs Firestore sont exposées via le signal syncError et affichées dans le dashboard.", BODY))

    items.append(Paragraph("10.2 Désabonnement", H2))
    items.append(Paragraph(
        "L'unsubscribe Firestore (retour de onSnapshot) est stocké dans <i>unsub</i> "
        "et appelé automatiquement lors du changement d'utilisateur "
        "(déconnexion ou passage invité ↔ Google).", BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 11. Gestion des thèmes
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("11. Gestion des thèmes", H1))
    items.append(section_hr())
    items.append(Paragraph(
        "Les thèmes sont implémentés via des variables CSS (custom properties) "
        "définies dans <i>styles.scss</i> et appliquées à <i>:root</i> selon "
        "l'attribut <i>data-theme</i>. ThemeService change cet attribut via un effect() Angular.", BODY))

    css_vars = [
        ["Variable CSS", "Rôle"],
        ["--bg-primary",     "Fond principal de l'application"],
        ["--bg-secondary",   "Fond des panneaux et cartes"],
        ["--text-primary",   "Couleur de texte principale"],
        ["--text-secondary", "Couleur de texte secondaire"],
        ["--accent",         "Couleur d'accentuation (indigo #4F46E5)"],
        ["--border",         "Couleur des bordures"],
        ["--shadow",         "Couleur des ombres portées"],
        ["--node-hover",     "Survol des nœuds de l'arbre"],
        ["--font-content",   "Police pour le contenu riche"],
    ]
    items.append(styled_table(css_vars, [5*cm, W - 4*cm - 5*cm]))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 12. Export / Import
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("12. Export / Import JSON", H1))
    items.append(section_hr())

    items.append(Paragraph("12.1 Export", H2))
    items.append(Paragraph(
        "TreeService.exportJson() sérialise le document courant (TreeDocument) en JSON indenté "
        "et déclenche un téléchargement via un lien &lt;a&gt; temporaire. "
        "Le nom du fichier est dérivé du nom du document (espaces → underscores).", BODY))

    items.append(Paragraph("12.2 Import", H2))
    items.append(Paragraph(
        "importJson(jsonString) parse le JSON et vérifie la présence de <i>root.id</i> "
        "comme validation minimale. En cas d'erreur de parsing, une alerte native est affichée. "
        "L'import remplace intégralement le document courant.", BODY))

    items.append(Paragraph(
        "⚠️ L'import ne gère pas la migration de version : les structures JSON créées "
        "avec une version antérieure peuvent manquer des champs optionnels, "
        "ce qui est géré par les valeurs par défaut des champs optionnels (?).", WARN_BOX))

    # ─────────────────────────────────────────────────────────────────
    # 13. Mode impression PDF
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("13. Mode impression PDF", H1))
    items.append(section_hr())
    items.append(Paragraph(
        "PrintViewComponent génère un rendu lisible de l'arbre entier. "
        "Il est masqué en affichage normal et visible via @media print. "
        "L'appel window.print() depuis ToolbarComponent déclenche la boîte de dialogue "
        "d'impression du navigateur, permettant d'enregistrer en PDF.", BODY))

    print_rules = [
        ["Profondeur", "Balise HTML", "Taille"],
        ["Niveau 1 (racine)", "h2", "18pt"],
        ["Niveau 2",          "h3", "16pt"],
        ["Niveau 3",          "h4", "14pt"],
        ["Niveau 4+",         "h5", "12pt (italique)"],
    ]
    items.append(styled_table(print_rules, [4*cm, 3*cm, W - 4*cm - 4*cm - 3*cm]))
    items.append(Paragraph(
        "La propriété CSS <i>page-break-inside: avoid</i> empêche la coupure au milieu d'un nœud. "
        "L'indentation est de 20px par niveau de profondeur.", BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 14. Déploiement
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("14. Déploiement", H1))
    items.append(section_hr())

    items.append(Paragraph("14.1 Web — Netlify", H2))
    items.append(Paragraph(
        "La commande <i>npm run build:web</i> (ng build --configuration production) "
        "produit le bundle dans <i>dist/treemap-editor/browser/</i>. "
        "Netlify sert ce répertoire. Le fichier <i>netlify.toml</i> configure un "
        "redirect SPA : toutes les routes → index.html (status 200).", BODY))

    items.append(Paragraph("Variables d'environnement (Netlify)", H3))
    items.append(Paragraph(
        "Le script <i>scripts/set-env.js</i> lit les variables d'environnement système "
        "(FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc.) et génère "
        "<i>src/environments/environment.ts</i> avant le build Angular.", BODY))

    env_vars = [
        ["Variable env", "Destination dans environment.ts"],
        ["FIREBASE_API_KEY",          "firebaseConfig.apiKey"],
        ["FIREBASE_AUTH_DOMAIN",      "firebaseConfig.authDomain"],
        ["FIREBASE_PROJECT_ID",       "firebaseConfig.projectId"],
        ["FIREBASE_STORAGE_BUCKET",   "firebaseConfig.storageBucket"],
        ["FIREBASE_MESSAGING_SENDER_ID","firebaseConfig.messagingSenderId"],
        ["FIREBASE_APP_ID",           "firebaseConfig.appId"],
        ["GOOGLE_CLIENT_ID",          "googleClientId"],
    ]
    items.append(styled_table(env_vars, [5.5*cm, W - 4*cm - 5.5*cm]))

    items.append(Paragraph("14.2 Desktop — Electron", H2))
    items.append(Paragraph(
        "La commande <i>npm run electron:build</i> exécute set-env.js + ng build + electron-builder. "
        "Le résultat est un exécutable portable Windows dans le répertoire <i>release/</i>. "
        "Le processus principal (<i>main.js</i>) lance la fenêtre BrowserWindow "
        "avec <i>preload.js</i> qui expose <i>window.ipcRenderer</i> de manière sandboxée.", BODY))

    electron_config = [
        ["Paramètre", "Valeur"],
        ["appId",       "com.treemap.editor"],
        ["productName", "TreeMapEditor"],
        ["Output",      "release/"],
        ["Target",      "portable (Windows)"],
        ["Files",       "dist/treemap-editor/**, main.js, package.json"],
    ]
    items.append(styled_table(electron_config, [4*cm, W - 4*cm - 4*cm]))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 15. Sécurité
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("15. Sécurité", H1))
    items.append(section_hr())

    items.append(Paragraph("15.1 Authentification", H2))
    sec_auth = [
        "Firebase Auth gère la validation des tokens (JWT) côté serveur.",
        "Les tokens Google sont échangés via le flux PKCE dans Electron (pas de client_secret exposé).",
        "La persistance browserLocalPersistence évite les re-authentifications inutiles.",
        "signOut() est appelé côté Firebase lors de la déconnexion (révocation de session).",
    ]
    for s_text in sec_auth:
        items.append(Paragraph(f"• {s_text}", BULLET))

    items.append(Paragraph("15.2 Firestore Security Rules", H2))
    items.append(Paragraph(
        "La configuration Firestore doit être protégée par des règles de sécurité "
        "garantissant que chaque utilisateur ne peut accéder qu'à sa propre sous-collection :", BODY))
    rules_code = (
        "rules_version = '2';\n"
        "service cloud.firestore {\n"
        "  match /databases/{database}/documents {\n"
        "    match /users/{userId}/treemaps/{treemapId} {\n"
        "      allow read, write: if request.auth != null\n"
        "                          && request.auth.uid == userId;\n"
        "    }\n"
        "  }\n"
        "}"
    )
    items.append(Paragraph(rules_code.replace("\n","<br/>").replace(" ","&nbsp;"), CODE))

    items.append(Paragraph("15.3 Variables d'environnement", H2))
    items.append(Paragraph(
        "Les clés Firebase ne sont pas committées en dur. "
        "Le script set-env.js les injecte depuis les variables d'environnement système "
        "au moment du build. Le fichier environment.ts généré est gitignored en production.", BODY))

    items.append(Paragraph("15.4 XSS", H2))
    items.append(Paragraph(
        "Le contenu de type 'text' est rendu via [innerHTML]. "
        "Angular sanitize automatiquement le HTML via DomSanitizer. "
        "L'éditeur contenteditable utilise document.execCommand (déprécié) — "
        "une migration vers une bibliothèque d'éditeur riche (Quill, Tiptap) est recommandée.", BODY))
    items.append(Paragraph(
        "⚠️ Les images importées localement sont converties en base64 data URI et stockées "
        "directement dans le JSON/Firestore, ce qui peut générer des documents très volumineux "
        "pour des images haute résolution.", WARN_BOX))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 16. Performances
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("16. Performances", H1))
    items.append(section_hr())

    perf_data = [
        ["Aspect", "Implémentation", "Impact"],
        ["Lazy loading",      "loadComponent() sur toutes les routes",       "Bundle initial réduit"],
        ["Angular Signals",   "Réactivité fine-grained, pas de dirty-check global", "Moins de re-renders"],
        ["Auto-save debounce","debounceTime(500ms) sur Subject",              "Max 2 écritures/s"],
        ["Firestore onSnapshot","Abonnement temps-réel (delta, pas full-fetch)","Trafic réseau minimal"],
        ["Optimistic update", "Signal mis à jour avant Firestore",            "Latence perçue nulle"],
        ["TrackBy",           "@for ... track tm.id dans les listes",         "DOM diffing optimisé"],
    ]
    items.append(styled_table(perf_data, [3.5*cm, 5.5*cm, W - 4*cm - 3.5*cm - 5.5*cm]))

    # ─────────────────────────────────────────────────────────────────
    # 17. Contraintes et limitations
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("17. Contraintes et limitations connues", H1))
    items.append(section_hr())

    limitations = [
        ("Taille des documents Firestore",
         "Limite de 1 Mo par document. Les arbres avec beaucoup d'images base64 peuvent dépasser cette limite."),
        ("document.execCommand() déprécié",
         "L'éditeur texte riche utilise une API navigateur dépréciée. Fonctionnel mais non supporté dans Safari futur."),
        ("Pas de collaboration temps-réel",
         "Deux utilisateurs éditant le même TreeMap simultanément créeront des conflits d'écrasement (last-write-wins)."),
        ("Drag & Drop non implémenté",
         "La méthode moveNode() existe dans TreeService mais l'interface drag & drop n'est pas encore exposée dans TreeViewComponent."),
        ("Absence de tests automatisés",
         "Aucune suite de tests unitaires ou e2e n'est configurée. Risque lors des évolutions."),
        ("Google Client ID Desktop exposé",
         "Le googleClientId Electron est inclus dans le bundle. Acceptable pour un client desktop public mais à surveiller."),
    ]
    for title, desc in limitations:
        items.append(Paragraph(f"<b>{title}</b>", H3))
        items.append(Paragraph(desc, BODY))
    items.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────
    # 18. Évolutions futures
    # ─────────────────────────────────────────────────────────────────
    items.append(Paragraph("18. Évolutions futures", H1))
    items.append(section_hr())

    evolutions = [
        ["Priorité", "Feature", "Justification"],
        ["Haute",   "Migration éditeur texte → Tiptap/Quill",       "Remplacer execCommand déprécié"],
        ["Haute",   "Tests unitaires Jest + Cypress e2e",           "Fiabilité des évolutions"],
        ["Haute",   "Drag & Drop UI dans TreeView",                 "UX réorganisation nœuds"],
        ["Moyenne", "Sous-collections Firestore pour grands arbres","Dépasser la limite 1 Mo"],
        ["Moyenne", "Partage de TreeMap (lien lecture seule)",       "Collaboration async"],
        ["Moyenne", "Historique des versions (undo/redo)",           "Sécurité édition"],
        ["Basse",   "Export Markdown / XLSX",                        "Interopérabilité"],
        ["Basse",   "Mode collaboratif temps-réel (CRDT)",           "Édition simultanée"],
        ["Basse",   "PWA (Service Worker + mode offline)",           "Utilisabilité sans réseau"],
    ]
    items.append(styled_table(evolutions, [2*cm, 5.5*cm, W - 4*cm - 2*cm - 5.5*cm]))

    items.append(Spacer(1, 1.5*cm))
    items.append(HRFlowable(width="100%", thickness=1, color=INDIGO, spaceAfter=12))
    items.append(Paragraph(
        f"Document généré le {DATE} — TreeMap Editor v{VERSION} — Confidentiel", CAPTION))

    return items

# ── Build ─────────────────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=1.8*cm, bottomMargin=1.5*cm,
        title=f"Spécification Technique — TreeMap Editor {VERSION}",
        author="Équipe développement",
        subject="Architecture et conception",
    )

    story = []
    story += cover_page()
    story += toc()
    story += content()

    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print(f"✅ PDF généré : {OUTPUT}")

if __name__ == "__main__":
    build()
