// This file is kept for backward compatibility
// It re-exports the shared Header component
import { Header as SharedHeader } from "../layout/Header";

export function DashboardHeader() {
  return <SharedHeader />;
} 