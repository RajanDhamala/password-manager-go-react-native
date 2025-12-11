import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect } from 'expo-router';

const queryClient = new QueryClient();

export default function Index() {
  return (
    <QueryClientProvider client={queryClient}>
      <Redirect href="/(tabs)/home" />
    </QueryClientProvider>
  );
}


