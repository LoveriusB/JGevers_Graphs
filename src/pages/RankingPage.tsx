import { ThemeProvider } from '@mui/material/styles';
import { RankingView } from '../features/ranking/RankingView';
import { theme } from '../features/ranking/theme/theme';

export default function RankingPage() {
  return <ThemeProvider theme={theme}><RankingView /></ThemeProvider>;
}
