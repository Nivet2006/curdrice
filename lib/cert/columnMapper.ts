// Smart Column Mapper Utility for Certificate Generator
import { CertField } from './types';

// Pre-defined mapping aliases
const ALIAS_MAP: Record<string, string[]> = {
  name: ['name', 'full_name', 'fullname', 'recipient name', 'recipient_name', 'student name', 'student_name'],
  email: ['email', 'email address', 'email_address', 'mail'],
  usn: ['usn', 'roll no', 'roll_no', 'roll number', 'roll_number', 'usn/roll'],
  department: ['department', 'dept', 'branch', 'stream'],
  semester: ['semester', 'sem', 'term'],
  year: ['year', 'yr'],
  date: ['date', 'issue date', 'issue_date', 'date of issue', 'created_at'],
  course: ['course', 'course title', 'course_title', 'event', 'event name', 'event_name'],
  school: ['school', 'institution', 'college', 'university', 'institution/school']
};

/**
 * Normalizes a string to lower case and removes spaces, underscores, and dashes
 */
function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Checks if a header matches a field label/key based on aliases or direct matches.
 */
export function isHeaderMatch(header: string, fieldLabel: string): boolean {
  const normHeader = normalizeString(header);
  const normLabel = normalizeString(fieldLabel);

  if (normHeader === normLabel) return true;

  // Check aliases
  for (const [key, aliases] of Object.entries(ALIAS_MAP)) {
    const isFieldLabelKey = normalizeString(key) === normLabel || aliases.map(normalizeString).includes(normLabel);
    if (isFieldLabelKey) {
      // Check if header is in aliases or matches the key
      if (normHeader === normalizeString(key) || aliases.map(normalizeString).includes(normHeader)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Automatically maps placed fields to available data headers.
 * Does not overwrite fields that already have valid mappings.
 */
export function autoMapFields(fields: CertField[], headers: string[]): CertField[] {
  return fields.map(field => {
    // If it is already mapped and the column exists in headers, keep it
    if (field.dataColumn && headers.includes(field.dataColumn)) {
      return field;
    }

    // Try to find a match
    const matchedHeader = headers.find(header => isHeaderMatch(header, field.label) || (field.dataColumn && isHeaderMatch(header, field.dataColumn)));
    
    return {
      ...field,
      dataColumn: matchedHeader || null // Do not default to headers[0]
    };
  });
}
