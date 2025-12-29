export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | 'IS NULL' | 'IS NOT NULL' | 'IN' | 'LIKE';
  value?: any;
}

export interface FieldInfo {
  path: string;
  types: string[];
  uniqueValues: any[];
  nullCount: number;
  totalCount: number;
}

export interface FieldAnalysis {
  path: string;
  types: Set<string>;
  isArray: boolean;
  isNullable: boolean;
  samples: any[];
  occurrence: number;
  maxLength?: number;
  suggestedTable: string;
  suggestedColumn: string;
  suggestedType: string;
}

export interface SchemaAnalysis {
  fields: FieldAnalysis[];
  totalRecords: number;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  isNew?: boolean;
}

export interface FieldMapping {
  sourcePath: string;
  targetTable: string;
  targetColumn: string;
  dataType: string;
  isArray: boolean;
  transformation?: string;
}

export interface TableRelationship {
  parentTable: string;
  childTable: string;
  foreignKeyColumn: string;
  parentKeyColumn: string;
}
