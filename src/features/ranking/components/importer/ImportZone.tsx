import { ExcelImportZone } from '../../../../components/graphs/ExcelImportZone';
import { parseWorkbook } from '../../revenue/parseWorkbook';
import type { RevenueDataset } from '../../revenue/types';

interface Props {
  onImport: (dataset: RevenueDataset) => void;
  compact?: boolean;
}

export function ImportZone({ onImport, compact = false }: Props) {
  return <ExcelImportZone onImport={onImport} parseFile={parseWorkbook} compact={compact} />;
}
