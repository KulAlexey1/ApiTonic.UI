import { IndexStructure } from "./index-structure.type";

export interface QueryResult { 
    data: any;
    indexStructure: IndexStructure;
    dataPathByAlias: { [alias: string]: string };
}
