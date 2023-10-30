import { Expression } from './expression.model';
import { QueryConfig } from './query-config.model';

export interface QueryConfigExpressions extends QueryConfig {
    expressions: Expression[];
    usedIndexes: string[];
}