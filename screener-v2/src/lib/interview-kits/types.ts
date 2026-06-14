export type KitCompetencyAnchor = {
  "1"?: string;
  "3"?: string;
  "5"?: string;
};

export type InterviewKitCompetency = {
  id: string;
  kitId: string;
  name: string;
  description: string | null;
  anchors: KitCompetencyAnchor;
  sortOrder: number;
};

export type InterviewKitListItem = {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  isGlobal: boolean;
  competencyCount: number;
  createdAt: string;
  updatedAt: string;
};

export type InterviewKitDetail = {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  isGlobal: boolean;
  competencies: InterviewKitCompetency[];
  createdAt: string;
  updatedAt: string;
};
