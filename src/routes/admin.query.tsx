import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/query")({
  component: function AdminQueryRedirect() {
    return <Navigate to="/finder" />;
  },
});
