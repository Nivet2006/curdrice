import * as React from 'react';
import { CertificateGeneratorWorkspace } from '@/components/cert/CertificateGeneratorWorkspace';

export const metadata = {
  title: 'Admin Certificate Center — Club-Eve',
  description: 'Design and batch-produce award templates for student events'
};

export default function AdminCertPage() {
  return <CertificateGeneratorWorkspace isAdmin={true} />;
}
