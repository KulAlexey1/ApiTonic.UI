import { CellValue } from './cell-value.model';
import { Expression } from './expression.model';

export interface CellValueExpressions extends CellValue {
    keyExpressions: Expression[];
    valueExpressions: Expression[];
}
