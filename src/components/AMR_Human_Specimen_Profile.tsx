import React from 'react';
import { AMR_Human_Demographic_AgeSUM } from './AMR_Human_Demographic_AgeSUM';
import { AMR_Human_Demographic_SexSUM } from './AMR_Human_Demographic_SexSUM';
import { AMR_Human_Demographic_GeographySUM } from './AMR_Human_Demographic_GeographySUM';
import { AMR_Human_Demographic_AgeChart } from './AMR_Human_Demographic_AgeChart';
import { AMR_Human_Demographic_SexChart } from './AMR_Human_Demographic_SexChart';
import { AMR_Human_Demographic_GeographyChart } from './AMR_Human_Demographic_GeographyChart';
import { AMU_Human_Demograph_RSex } from './AMU_Human_Demograph_RSex';

export function AMR_Human_Specimen_Profile() {
  return (
    <div className="space-y-6">
      {/* Demographic Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AMR_Human_Demographic_AgeSUM />
        <AMR_Human_Demographic_SexSUM />
        <AMR_Human_Demographic_GeographySUM />
      </div>
      
      {/* Detailed Charts */}
      <div className="w-full space-y-6">
        <AMU_Human_Demograph_RSex />
        <AMR_Human_Demographic_AgeChart />
        <AMR_Human_Demographic_SexChart />
        <AMR_Human_Demographic_GeographyChart />
      </div>
    </div>
  );
}