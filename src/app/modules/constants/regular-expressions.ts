export class RegularExpressions {
    public static readonly expression =  /\{\{.*?\}\}/g;
    public static readonly arrayExpression = /\[.*?\]/g;
    public static readonly bracketedExpression = /\(.*?\)/g;
    public static readonly methodExpression = /.+\(.*\)/g;
    public static readonly notAllowedAliasCharsExpression = /[^_A-Za-z][^_0-9A-Za-z]*/g;
}
