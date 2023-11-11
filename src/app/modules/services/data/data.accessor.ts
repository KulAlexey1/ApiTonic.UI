import { ExpressionHelpers } from '../helpers';

export class DataAccessor {
    static getDataByPath(path: string, data: any): any {
        return path.split('.').reduce((obj, prop) => {
            const arrExpression = ExpressionHelpers.getArrayExpression(prop);

            if (!arrExpression) {
                return Array.isArray(obj)
                    ? obj.map(x => x[prop])
                    : (obj || {})[prop];
            }

            return arrExpression.indexes.reduce((o, idx) => o[idx], obj[arrExpression.arrayName]);
        }, data)
    }
}
