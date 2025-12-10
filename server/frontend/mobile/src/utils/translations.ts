import { TFunction } from 'i18next';

/**
 * Translates task/project status values
 */
export const translateStatus = (status: string, t: TFunction): string => {
  const statusLower = status?.toLowerCase() || '';
  
  switch (statusLower) {
    case 'active':
    case 'actif':
      return t('status.active');
    case 'inactive':
    case 'inactif':
      return t('status.inactive');
    case 'pending':
    case 'en_attente':
      return t('status.pending');
    case 'in_progress':
    case 'in progress':
    case 'en_cours':
      return t('status.in_progress');
    case 'done':
    case 'completed':
    case 'complete':
    case 'terminé':
      return t('status.completed');
    case 'todo':
    case 'to_do':
    case 'à_faire':
      return t('status.todo');
    case 'on_hold':
    case 'on hold':
    case 'en_pause':
      return t('status.on_hold');
    case 'cancelled':
    case 'canceled':
    case 'annulé':
      return t('status.cancelled');
    case 'overdue':
    case 'en_retard':
      return t('status.overdue');
    default:
      // Return original status if no translation found
      return status || t('status.unknown');
  }
};

/**
 * Translates priority values
 */
export const translatePriority = (priority: string, t: TFunction): string => {
  const priorityLower = priority?.toLowerCase() || '';
  
  switch (priorityLower) {
    case 'high':
    case 'haut':
      return t('priority.high');
    case 'medium':
    case 'moyen':
      return t('priority.medium');
    case 'low':
    case 'bas':
      return t('priority.low');
    case 'critical':
    case 'critique':
      return t('priority.critical');
    default:
      return priority || t('priority.normal');
  }
};

/**
 * Translates role values
 */
export const translateRole = (role: string, t: TFunction): string => {
  const roleLower = role?.toLowerCase() || '';
  
  switch (roleLower) {
    case 'admin':
    case 'administrator':
      return t('roles.admin');
    case 'manager':
    case 'gestionnaire':
      return t('roles.manager');
    case 'employee':
    case 'employé':
      return t('roles.employee');
    default:
      return role || t('roles.user');
  }
};

/**
 * Translates common project names
 * This is a dictionary-based approach for common project names
 * Custom project names will remain as-is if not found in dictionary
 */
export const translateProjectName = (projectName: string, t: TFunction): string => {
  if (!projectName) return projectName;
  
  const nameLower = projectName.toLowerCase().trim();
  
  // Common project name translations
  const projectTranslations: Record<string, string> = {
    'security audit': t('projects.security_audit'),
    'ui/ux redesign': t('projects.ui_ux_redesign'),
    'ui/ux design review': t('projects.ui_ux_redesign'),
    'api integration': t('projects.api_integration'),
    'mobile app development': t('projects.mobile_app_development'),
    'real-time data streaming': t('projects.real_time_data_streaming'),
    'data warehouse migration': t('projects.data_warehouse_migration'),
    'website redesign': t('projects.website_redesign'),
    'cloud migration': t('projects.cloud_migration'),
    'system upgrade': t('projects.system_upgrade'),
    'database optimization': t('projects.database_optimization'),
    'security implementation': t('projects.security_implementation'),
    'mobile app redesign': t('projects.mobile_app_redesign'),
  };
  
  // Try exact match first
  if (projectTranslations[nameLower]) {
    return projectTranslations[nameLower];
  }
  
  // Try partial matches for common patterns
  for (const [key, translation] of Object.entries(projectTranslations)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return translation;
    }
  }
  
  // If no translation found, return original name
  return projectName;
};

/**
 * Translates common client names
 * Similar to project names, this uses a dictionary approach
 */
export const translateClientName = (clientName: string, t: TFunction): string => {
  if (!clientName) return clientName;
  
  const nameLower = clientName.toLowerCase().trim();
  
  // Common client name translations (if you have standard clients)
  const clientTranslations: Record<string, string> = {
    // Add common client names here if needed
  };
  
  if (clientTranslations[nameLower]) {
    return clientTranslations[nameLower];
  }
  
  // Return original if no translation
  return clientName;
};

