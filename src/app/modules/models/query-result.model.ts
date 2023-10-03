import { IndexStructure } from './index-structure.model';

export interface QueryResult { 
    data: any;
    indexStructure: IndexStructure[];
    dataPathByAlias: { [alias: string]: string };
}
