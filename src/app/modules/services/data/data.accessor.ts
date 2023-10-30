import { RegularExpressions } from '../../constants';

export class DataAccessor {
    static getDataByPath(path: string, data: any): any {
        return path.split('.').reduce((obj, prop) => {
            const idxMatches = prop.match(RegularExpressions.arrayExpression);
            if (!idxMatches) {
                return (obj || {})[prop];
            }

            return idxMatches.reduce(
                (o, idxString) => o[idxString.slice(1, idxString.length - 1)],
                obj[prop.replaceAll(RegularExpressions.arrayExpression, "")]
            );
        }, data)
    }
}
