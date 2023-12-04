import { ExpressionHelpers } from '../helpers';

export class DataAccessor {
    static getDataByPath(path: string, data: any): any {
        return this.clearPath(path).split('.').map(p => p.trim()).reduce((obj, prop) => {
            const arrExpression = ExpressionHelpers.getArrayExpression(prop);

            if (arrExpression) {
                const arr: any[] | {} = Array.isArray(obj)
                    ? obj.map(x => x[arrExpression.arrayName])
                    : obj[arrExpression.arrayName];
                return arrExpression.indexes.reduce((a: any, idx) => a[idx], arr);
            } else {
                return Array.isArray(obj)
                    ? obj.map(x => x[prop])
                    : (obj || {})[prop];
            }
        }, data)
    }

    private static clearPath(path: string): string {
        while (true) {
            const aliasStartIdx = path.indexOf(':');
            if (aliasStartIdx === -1) {
                break;
            }
            const aliasEndIdx = path.indexOf('.', aliasStartIdx + 1);

            path = path.substring(0, aliasStartIdx) + (aliasEndIdx === -1 ? '' : path.substring(aliasEndIdx));
        }

        return path;
    }
}
