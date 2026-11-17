import { ThemeProvider } from '@mui/material/styles';
import { SankeyView } from '../features/case-flow/SankeyView';
import { theme } from '../features/ranking/theme/theme';

export default function SankeyPage() {
  return <ThemeProvider theme={theme}><SankeyView /></ThemeProvider>;
}
