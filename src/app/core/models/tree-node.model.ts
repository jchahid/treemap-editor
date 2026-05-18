export interface TaskItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TreeNode {
  id: string;           // UUID auto-généré
  title: string;        // Titre obligatoire
  contentType: 'text' | 'image' | 'tasks' | 'code';
  content: string;      // Texte, URL image, ou Code
  children: TreeNode[];
  expanded: boolean;    // Nœud déplié ou replié
  createdAt: string;    // ISO timestamp
  
  // Nouveaux champs
  ticketNumber?: string;
  price?: number;
  days?: number;

  // Visibilité (coché par défaut)
  showPrice?: boolean;
  showDays?: boolean;
  showDescription?: boolean;

  // Spécifique Tasks/Code
  tasks?: TaskItem[];
  codeLanguage?: string;
  codeExpanded?: boolean;
}

export interface TreeDocument {
  id: string;
  name: string;
  root: TreeNode;
  updatedAt: string;
}
