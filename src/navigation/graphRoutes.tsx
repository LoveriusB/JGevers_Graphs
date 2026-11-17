import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import HubRounded from '@mui/icons-material/HubRounded';
import RankingPage from '../pages/RankingPage';
import SankeyPage from '../pages/SankeyPage';

export const graphRoutes = [
  { path: '/ranking', label: 'Évolution du classement', icon: ShowChartRounded, page: RankingPage },
  { path: '/sankey', label: 'Case Flow Sankey', icon: HubRounded, page: SankeyPage },
] as const;
