import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorProvider } from "./contexts/ErrorContext";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./router/AppRoutes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationScheduler from "@/components/NotificationScheduler";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="light"
        >
          <TooltipProvider>
            <ErrorProvider>
              <AuthProvider>
                <AppRoutes />
                <NotificationScheduler />
                <Toaster />
              </AuthProvider>
            </ErrorProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
