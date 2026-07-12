import { ROLES } from '../config/roles'
import { ROUTES } from '../routes/routePaths'

const dashboards = {
  [ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
  [ROLES.ASSET_MANAGER]: ROUTES.ASSET_MANAGER_DASHBOARD,
  [ROLES.DEPARTMENT_HEAD]: ROUTES.DEPARTMENT_HEAD_DASHBOARD,
  [ROLES.EMPLOYEE]: ROUTES.EMPLOYEE_DASHBOARD,
}

export const getRoleDashboard = (role) => dashboards[role] || ROUTES.LOGIN
