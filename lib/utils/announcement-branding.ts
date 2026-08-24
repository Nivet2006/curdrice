import { AnnouncementType } from '@/lib/types'

export interface AnnouncementBrandingInfo {
  label: string
  shortLabel: string
  category: string
}

/**
 * Returns human-readable Club Eve branding label for any announcement type.
 * Safely handles unknown or future types with default fallback.
 */
export function getAnnouncementBranding(type?: string): AnnouncementBrandingInfo {
  const normType = (type || '').toUpperCase()

  switch (normType) {
    case 'SYSTEM_UPDATE':
      return {
        label: 'CLUB EVE · SYSTEM UPDATE',
        shortLabel: 'SYSTEM UPDATE',
        category: 'SYSTEM UPDATE'
      }

    case 'PLATFORM_UPGRADE':
      return {
        label: 'CLUB EVE · PLATFORM UPDATE',
        shortLabel: 'PLATFORM UPDATE',
        category: 'PLATFORM UPDATE'
      }

    case 'PERFORMANCE_NOTICE':
      return {
        label: 'CLUB EVE · PERFORMANCE NOTICE',
        shortLabel: 'PERFORMANCE',
        category: 'PERFORMANCE NOTICE'
      }

    case 'SCHEDULED_MAINTENANCE':
      return {
        label: 'CLUB EVE · MAINTENANCE',
        shortLabel: 'MAINTENANCE',
        category: 'SCHEDULED MAINTENANCE'
      }

    case 'EMERGENCY_MAINTENANCE':
      return {
        label: 'CLUB EVE · EMERGENCY MAINTENANCE',
        shortLabel: 'EMERGENCY',
        category: 'EMERGENCY MAINTENANCE'
      }

    case 'SERVICE_OUTAGE':
      return {
        label: 'CLUB EVE · SERVICE STATUS',
        shortLabel: 'SERVICE STATUS',
        category: 'SERVICE STATUS'
      }

    case 'SERVICE_RESTORED':
      return {
        label: 'CLUB EVE · SERVICE RESTORED',
        shortLabel: 'SERVICE RESTORED',
        category: 'SERVICE RESTORED'
      }

    case 'SECURITY_NOTICE':
      return {
        label: 'CLUB EVE · SECURITY',
        shortLabel: 'SECURITY',
        category: 'SECURITY NOTICE'
      }

    case 'NEW_FEATURE':
      return {
        label: 'CLUB EVE · NEW FEATURE',
        shortLabel: 'NEW FEATURE',
        category: 'NEW FEATURE'
      }

    case 'EVENT_ANNOUNCEMENT':
    case 'EVENT_UPDATE':
    case 'EVENT_CANCELLED':
      return {
        label: 'CLUB EVE · EVENT UPDATE',
        shortLabel: 'EVENT UPDATE',
        category: 'EVENT UPDATE'
      }

    case 'REGISTRATION_REMINDER':
    case 'DEADLINE_REMINDER':
      return {
        label: 'CLUB EVE · REGISTRATION',
        shortLabel: 'REGISTRATION',
        category: 'REGISTRATION'
      }

    case 'GENERAL_ANNOUNCEMENT':
    case 'CUSTOM':
    default:
      return {
        label: 'CLUB EVE · ANNOUNCEMENT',
        shortLabel: 'ANNOUNCEMENT',
        category: 'ANNOUNCEMENT'
      }
  }
}
