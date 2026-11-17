import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { graphRoutes } from './navigation/graphRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={graphRoutes[0].path} replace />} />
          {graphRoutes.map(({ path, page: Page }) => <Route key={path} path={path} element={<Page />} />)}
          <Route path="/graph-2" element={<Navigate to="/sankey" replace />} />
          <Route path="*" element={<Navigate to={graphRoutes[0].path} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
