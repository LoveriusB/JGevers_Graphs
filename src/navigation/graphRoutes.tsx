import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import RankingPage from '../pages/RankingPage';
import SecondGraphPage from '../pages/SecondGraphPage';

export const graphRoutes = [
  { path: '/ranking', label: 'Évolution du classement', icon: ShowChartRounded, page: RankingPage },
  { path: '/graph-2', label: 'Graphique 2', icon: BarChartRounded, page: SecondGraphPage },
] as const;
