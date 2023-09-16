import { QueryConfigExpression } from './query-config-expression.model';
import { QueryConfig } from './query-config.model';

export interface QueryConfigExpressions extends QueryConfig {
    expressions: QueryConfigExpression[];
}