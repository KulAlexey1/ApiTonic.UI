export interface QueryConfigExpression {
    query: string;
    expression: string;
    type: 'queryValue' | 'queryArray' | 'method'
}
