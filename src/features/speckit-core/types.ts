/**
 * Spec Kit Core Types
 */

export interface Constitution {
  principles: Principle[];
  projectName: string;
  generatedAt: string;
}

export interface Principle {
  title: string;
  description: string;
  rationale: string;
}

export interface Specification {
  feature: string;
  overview: string;
  requirements: Requirement[];
  constraints: string[];
  acceptanceCriteria: string[];
}

export interface Requirement {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TechnicalPlan {
  approach: string;
  components: Component[];
  dependencies: string[];
  risks: Risk[];
}

export interface Component {
  name: string;
  purpose: string;
  files: string[];
}

export interface Risk {
  description: string;
  mitigation: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dependencies: string[];
  estimatedEffort: string;
}
