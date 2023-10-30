import { IndexGroup, IndexValue, QueryConfig } from '../../models';
import { DataAccessor } from '../data/data.accessor';

export class QueryConfigIndexBuilder {
    static buildIndexGroup(arrayQueryConfig: Required<QueryConfig>, queryData: any): IndexGroup {
        if (!this.isQueryArray(arrayQueryConfig.query, queryData)) {
            throw new Error(`Invalid query config containing index and not array query. Query: ${arrayQueryConfig.query}, Index: ${arrayQueryConfig.index}`);
        }

        return (DataAccessor.getDataByPath(arrayQueryConfig.query, queryData) as Array<any>)
            ?.map((_, idx) => ({ index: arrayQueryConfig.index, value: idx } as IndexValue) );
    }

    private static isQueryArray(query: string, data: any): boolean {
        let propValue = data;

        for (const prop of query.split('.')) {
            propValue = propValue[prop];

            if (Array.isArray(propValue)) {
                return true;
            }
        }

        return false;
    }
}
