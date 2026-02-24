import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeamsList from './pages/TeamsList';
import TeamDetail from './pages/TeamDetail';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TeamsList />} />
          <Route path="/teams/:name" element={<TeamDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
