import { Route, Switch, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import AppContainer from "@/components/layout/AppContainer";
import Loading from "@/components/ui/Loading";

// Auth Pages
import Login from "@/pages/Auth/Login";
import Signup from "@/pages/Auth/Signup";
import Preload from "@/pages/Auth/Preload";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import { ChangePassword } from '@/pages/Auth/ChangePassword';

// App Pages
import Home from "@/pages/Home/Home";
import Profile from "@/pages/Profile/Profile";
import NotificationsPage from "@/pages/Notifications/NotificationsPage";

// Aviary Pages
import AviaryList from "@/pages/Aviaries/AviaryList";
import AviaryDetails from "@/pages/Aviaries/AviaryDetails";

// Groups (Sheds) Pages
import GroupList from "@/pages/Groups/GroupList";
import GroupCreate from "@/pages/Groups/GroupCreate";
import GroupDetails from "@/pages/Groups/GroupDetails";

// Batches (Lots) Pages
import BatchCreate from "@/pages/Groups/BatchCreate";
import BatchDetails from "@/pages/Groups/BatchDetails";
import BatchEdit from "@/pages/Groups/BatchEdit";
import BatchQRCode from "@/pages/Groups/BatchQRCode";
import GrowthBoxList from "@/pages/Groups/GrowthBoxList";

// Production Pages
import RegisterProduction from "@/pages/Production/RegisterProduction";
import ProductionHistory from "@/pages/Production/ProductionHistory";
import ProductionDashboard from "@/pages/Production/ProductionDashboard";
import CageDetails from "@/pages/Production/CageDetails";

// Incubation Pages
import IncubationList from "@/pages/Incubation/IncubationList";
import IncubationCreate from "@/pages/Incubation/IncubationCreate";
import IncubationDetails from "@/pages/Incubation/IncubationDetails";

// Mortality Pages
import RegisterMortality from "@/pages/Mortality/RegisterMortality";
import MortalityHistory from "@/pages/Mortality/MortalityHistory";

// Feed Pages
import FeedUsage from "@/pages/Feed/FeedUsage";

// Sales Pages
import RegisterSale from "@/pages/Sales/RegisterSale";
import SalesHistory from "@/pages/Sales/SalesHistory";

// Task Pages
import TaskAction from "@/pages/Tasks/TaskAction";
import TaskList from "@/pages/Tasks/TaskList";

// Warehouse Pages
import WarehouseDashboard from "@/pages/Warehouse/WarehouseDashboard";
import StockDetails from "@/pages/Warehouse/StockDetails";



// Admin Imports
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/pages/admin/dashboard/AdminDashboard";
import { AviariosList } from "@/pages/admin/aviarios/AviariosList";
import { AdminGroups } from "@/pages/admin/grupos/AdminGroups";
import { AdminCages } from "@/pages/admin/gaiolas/AdminCages";
import { AdminUsers } from "@/pages/admin/usuarios/AdminUsers";
import { AdminFinancial } from "@/pages/admin/financeiro/AdminFinancial";
import { AdminProducts } from "@/pages/admin/financeiro/AdminProducts";
import { AdminReports } from "@/pages/admin/relatorios/AdminReports";
import { AdminFeed } from "@/pages/admin/feed/AdminFeed";
import { AdminLotes } from "@/pages/admin/lotes/AdminLotes";
import { AdminNotifications } from "@/pages/admin/notifications/AdminNotifications";
import { AdminIncubation } from "@/pages/admin/incubation/AdminIncubation";
import { AdminGrowthBoxes } from "@/pages/admin/caixas/AdminGrowthBoxes";
import { AdminStock } from "@/pages/admin/stock/AdminStock";
import { AdminCosts } from "@/pages/admin/relatorios/AdminCosts";


function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loading fullScreen message="Verificando acesso..." />;
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return <AppContainer><Component /></AppContainer>;
}

export default function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 1. Initial Loading State
  if (isLoading) {
    return <Preload />;
  }

  // 2. Mandatory Password Change
  if (isAuthenticated && user?.change_password_required) {
    return (
      <Switch>
        <Route path="/change-password" component={ChangePassword} />
        <Route path="/:rest*" component={() => <Redirect to="/change-password" />} />
      </Switch>
    );
  }

  // 3. Main Router
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/preload" component={Preload} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/change-password" component={ChangePassword} />

      {/* Admin Routes */}
      <Route path="/admin">
        {isAuthenticated && user?.role === 'admin' ? (
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/admin/:rest*">
        {isAuthenticated && user?.role === 'admin' ? (
          <AdminLayout>
            <Switch>
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/" component={AdminDashboard} />
              <Route path="/admin/aviarios" component={AviariosList} />
              <Route path="/admin/grupos" component={AdminGroups} />
              <Route path="/admin/gaiolas" component={AdminCages} />
              <Route path="/admin/usuarios" component={AdminUsers} />
              <Route path="/admin/financeiro" component={AdminFinancial} />
              <Route path="/admin/produtos" component={AdminProducts} />
              <Route path="/admin/incubacao" component={AdminIncubation} />
              <Route path="/admin/alimentacao" component={AdminFeed} />
              <Route path="/admin/lotes" component={AdminLotes} />
              <Route path="/admin/estoque" component={AdminStock} />
              <Route path="/admin/caixas-crescimento" component={AdminGrowthBoxes} />
              <Route path="/admin/notificacoes" component={AdminNotifications} />
              <Route path="/admin/relatorios" component={AdminReports} />
              <Route path="/admin/custos" component={AdminCosts} />
              <Route component={() => <div className="p-4">Página Admin não encontrada</div>} />
            </Switch>
          </AdminLayout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* App Routes */}
      <Route path="/" component={() => <ProtectedRoute component={Home} />} />
      <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={NotificationsPage} />} />

      {/* Aviary Routes */}
      <Route path="/aviaries" component={() => <ProtectedRoute component={AviaryList} />} />
      <Route path="/aviaries/:id" component={() => <ProtectedRoute component={AviaryDetails} />} />
      <Route path="/groups" component={() => { window.location.href = "/aviaries"; return null; }} />
      <Route path="/groups/create" component={() => <ProtectedRoute component={GroupCreate} />} />
      <Route path="/groups/:id" component={() => <ProtectedRoute component={GroupDetails} />} />

      {/* Batches (Lots) Routes */}
      <Route path="/batches/create" component={() => <ProtectedRoute component={BatchCreate} />} />
      <Route path="/batches/growth" component={() => <ProtectedRoute component={GrowthBoxList} />} />
      <Route path="/batches/:id" component={() => <ProtectedRoute component={BatchDetails} />} />
      <Route path="/batches/:id/edit" component={() => <ProtectedRoute component={BatchEdit} />} />
      <Route path="/batches/:id/qrcode" component={() => <ProtectedRoute component={BatchQRCode} />} />
      <Route path="/groups/growth" component={() => <ProtectedRoute component={GrowthBoxList} />} />

      {/* Production Routes */}
      <Route path="/production" component={() => <ProtectedRoute component={ProductionHistory} />} />
      <Route path="/production/register" component={() => <ProtectedRoute component={RegisterProduction} />} />
      <Route path="/production-management" component={() => <ProtectedRoute component={ProductionDashboard} />} />
      <Route path="/production/cages/:id" component={() => <ProtectedRoute component={CageDetails} />} />

      {/* Incubation Routes */}
      <Route path="/incubation" component={() => <ProtectedRoute component={IncubationList} />} />
      <Route path="/incubation/create" component={() => <ProtectedRoute component={IncubationCreate} />} />
      <Route path="/incubation/:id" component={() => <ProtectedRoute component={IncubationDetails} />} />

      {/* Mortality Routes */}
      <Route path="/mortality" component={() => <ProtectedRoute component={ProductionHistory} />} />
      <Route path="/mortality/register" component={() => <ProtectedRoute component={RegisterMortality} />} />

      {/* Feed Routes */}
      <Route path="/feed" component={() => <ProtectedRoute component={FeedUsage} />} />

      {/* Sales Routes */}
      <Route path="/sales" component={() => <ProtectedRoute component={SalesHistory} />} />
      <Route path="/sales/register" component={() => <ProtectedRoute component={RegisterSale} />} />

      {/* Task Routes */}
      <Route path="/tasks/execute" component={() => <ProtectedRoute component={TaskAction} />} />
      <Route path="/tasks/list" component={() => <ProtectedRoute component={TaskList} />} />

      {/* Warehouse Routes */}
      <Route path="/warehouse" component={() => <ProtectedRoute component={WarehouseDashboard} />} />
      <Route path="/warehouse/:type" component={() => <ProtectedRoute component={StockDetails} />} />

      {/* Fallback */}
      <Route component={() => <ProtectedRoute component={() => <div className="text-center py-12">Página não encontrada</div>} />} />
    </Switch>
  );
}

