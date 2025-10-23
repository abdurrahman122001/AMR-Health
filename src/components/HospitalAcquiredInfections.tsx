import React from 'react';
import { MRSABloodstreamInfections } from './MRSABloodstreamInfections';
import { EcoliBloodstreamInfections } from './EcoliBloodstreamInfections';

export function HospitalAcquiredInfections() {
  return (
    <div className="space-y-[24px]">
      <MRSABloodstreamInfections />
      <EcoliBloodstreamInfections />
    </div>
  );
}