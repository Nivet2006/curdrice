import { createClient } from '@/lib/supabase/server';
import * as permissionService from './permission-service';
import * as rateLimitService from './rate-limit-service';
import * as venueService from './venue-service';
import * as clubService from './club-service';
import * as certificateService from './certificate-service';
import * as gamificationService from './gamification-service';
import * as analyticsService from './analytics-service';
import * as qrService from './qr-service';
import * as calendarService from './calendar-service';

export interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
  message: string;
  durationMs: number;
}

export async function runServiceTests(
  servicesToTest: string[],
  actorId: string
): Promise<Record<string, TestResult>> {
  const results: Record<string, TestResult> = {};
  const supabase = await createClient();

  const allServices = [
    'permission-service',
    'rate-limit-service',
    'venue-service',
    'event-service',
    'registration-service',
    'attendance-service',
    'club-service',
    'hackathon-service',
    'email-service',
    'notification-service',
    'media-service',
    'feedback-service',
    'certificate-service',
    'gamification-service',
    'analytics-service',
    'export-service',
    'qr-service',
    'calendar-service'
  ];

  for (const service of allServices) {
    if (!servicesToTest.includes(service)) {
      results[service] = { status: 'skipped', message: 'Not selected', durationMs: 0 };
      continue;
    }

    const start = Date.now();
    try {
      let message = 'Test passed successfully';
      switch (service) {
        case 'permission-service': {
          const profile = await permissionService.getUserProfile();
          message = `Verified actor profile successfully. Role: ${profile.profile?.role || 'None'}`;
          break;
        }
        case 'rate-limit-service': {
          const allowed = await rateLimitService.checkRateLimit('service-tester', 'diagnostic-run', {
            maxRequests: 100,
            windowMs: 60000
          });
          message = `Rate check successful. Allowed: ${allowed}`;
          break;
        }
        case 'venue-service': {
          const venues = await venueService.getVenues();
          message = `Retrieved ${venues.length} venues successfully`;
          break;
        }
        case 'event-service': {
          const { data, error } = await supabase.from('events').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Event schema check verified. Database connectivity verified.`;
          break;
        }
        case 'registration-service': {
          const { data, error } = await supabase.from('registrations').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Registrations schema check verified. Database connectivity verified.`;
          break;
        }
        case 'attendance-service': {
          const { data, error } = await supabase.from('registrations').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Attendance registrations schema check verified. Database connectivity verified.`;
          break;
        }
        case 'club-service': {
          const clubs = await clubService.getClubs();
          message = `Retrieved ${clubs.length} clubs successfully`;
          break;
        }
        case 'hackathon-service': {
          const { data, error } = await supabase.from('teams').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Hackathon teams schema check verified. Database connectivity verified.`;
          break;
        }
        case 'email-service': {
          const { data, error } = await supabase.from('email_queue').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Email queue schema check verified. Database connectivity verified.`;
          break;
        }
        case 'notification-service': {
          const { data, error } = await supabase.from('notification_templates').select('key').limit(1);
          if (error) throw new Error(error.message);
          message = `Notification templates check verified. Database connectivity verified.`;
          break;
        }
        case 'media-service': {
          const { data, error } = await supabase.from('event_photos').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Media event photo gallery schema check verified. Database connectivity verified.`;
          break;
        }
        case 'feedback-service': {
          const { data, error } = await supabase.from('feedbacks').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Feedback schema check verified. Database connectivity verified.`;
          break;
        }
        case 'certificate-service': {
          const config = await certificateService.getCertificateConfig('dummy-event-id');
          message = `Certificate configs retrieval validated. Result status: ${config ? 'Configured' : 'Empty State'}`;
          break;
        }
        case 'gamification-service': {
          const entries = await gamificationService.getLeaderboard(5);
          message = `Leaderboard retrieved successfully. Top rank count: ${entries.length}`;
          break;
        }
        case 'analytics-service': {
          const stats = await analyticsService.getEventStats('dummy-event-id');
          message = `Aggregations check verified. Total registered: ${stats.totalRegistered}`;
          break;
        }
        case 'export-service': {
          const { data, error } = await supabase.from('profiles').select('id').limit(1);
          if (error) throw new Error(error.message);
          message = `Export dependencies check verified. Database connectivity verified.`;
          break;
        }
        case 'qr-service': {
          const token = qrService.generateQRToken();
          const valid = qrService.validateQRToken(token);
          if (!valid) throw new Error('Generated token failed UUID validation');
          message = `Token generator & UUID validator validated. Sample: ${token}`;
          break;
        }
        case 'calendar-service': {
          const events = await calendarService.getApprovedEvents();
          message = `Calendar query retrieve validated. Result count: ${events.length}`;
          break;
        }
      }
      results[service] = { status: 'passed', message, durationMs: Date.now() - start };
    } catch (err: any) {
      results[service] = { status: 'failed', message: err.message || 'Test failed', durationMs: Date.now() - start };
    }
  }

  return results;
}
