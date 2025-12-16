import { Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Jobs } from './pages/Jobs';
import { Customers } from './pages/Customers';
import { Vehicles } from './pages/Vehicles';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { useStore } from './stores/RootStore';

const App = observer(() => {
  const { authStore } = useStore();

  if (!authStore.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs/*" element={<Jobs />} />
        <Route path="/customers/*" element={<Customers />} />
        <Route path="/vehicles/*" element={<Vehicles />} />
        <Route path="/inventory/*" element={<Inventory />} />
        <Route path="/settings/*" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
});

export default App;

