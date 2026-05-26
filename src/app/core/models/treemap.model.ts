import { TreeDocument } from './tree-node.model';

export type TreeMapStatus = 'en-cours' | 'terminé' | 'brouillon';

export interface TreeMapMeta {
  id: string;
  title: string;
  status: TreeMapStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TreeMapDocument extends TreeMapMeta {
  data: TreeDocument;
}
