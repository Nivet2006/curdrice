import * as React from 'react';
import { CertificateGeneratorWorkspace } from '@/components/cert/CertificateGeneratorWorkspace';

export const metadata = {
  title: 'Certificate Generator — Club-Eve',
  description: 'Design and batch-produce award templates for student events'
};

export default function FacultyCertPage() {
  return <CertificateGeneratorWorkspace isAdmin={false} />;
}
