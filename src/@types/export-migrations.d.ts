export interface ExportMigrationsProps {
  migrationsSource?: string;
  migrationsDestination?: string;
  matchRegExp?: RegExp;
}

export type ExportMigrations = (props: ExportMigrationsProps) => void;

export const exportMigrations: ExportMigrations;
export default exportMigrations;