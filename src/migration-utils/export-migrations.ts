import fs from 'fs';
import path from 'path';

import { ExportMigrationsProps } from '../@types/export-migrations';

const exportMigrations = (props: ExportMigrationsProps) => {
  const initCWD = process.env.INIT_CWD;
  const config: Required<ExportMigrationsProps> = {
    migrationsSource: path.resolve(__dirname, '../.knex/migrations'),
    migrationsDestination: path.resolve(initCWD, './.knex/migrations'),
    matchRegExp: /\.js$/,
    ...props,
  };
  const { migrationsSource, migrationsDestination, matchRegExp } = config;
  const migrationFiles = fs.readdirSync(migrationsSource)
    .filter((filename) => filename.match(matchRegExp));


  if (!fs.existsSync(path.basename(migrationsSource))) {
    return;
  }

  if (!fs.existsSync(path.basename(migrationsDestination))) {
    try {
      fs.mkdirSync(path.basename(migrationsDestination), { recursive: true });
    } catch (err) {
      throw Error('Knex Migrations Error. Failed to create migrations destination directory');
    }
  }

  migrationFiles.forEach((filename) => {
   try {
      fs.copyFileSync(
      path.resolve(migrationsSource, filename),
      path.resolve(migrationsDestination, filename),
    )
   } catch (err) {
     throw Error('Knex Migrations Error. Failed to copy migrations');
   }
  });

}
export { exportMigrations };
export default exportMigrations;
