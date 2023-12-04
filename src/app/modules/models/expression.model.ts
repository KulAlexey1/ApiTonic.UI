export interface Expression {
    expression: string;
    type: 'value' | 'array' | 'method' | 'index' | 'indexGroups' 
}
