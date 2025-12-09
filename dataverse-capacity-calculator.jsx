import React, { useState, useMemo, useEffect } from 'react';

// SKU definitions with capacity values (December 2025)
// Using new data model from specs.md
const SKUS = [
  // D365 ERP Premium
  {
    id: 'finance-premium',
    name: 'Finance Premium',
    family: 'Dynamics365',
    product_group: 'ERPPremium',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 125, file_gb: 110 },
    accrual: { db_gb: 10, file_gb: 10 },
    accrues_capacity: true
  },
  {
    id: 'scm-premium',
    name: 'SCM Premium',
    family: 'Dynamics365',
    product_group: 'ERPPremium',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 125, file_gb: 110 },
    accrual: { db_gb: 10, file_gb: 10 },
    accrues_capacity: true
  },
  // D365 ERP Standard
  {
    id: 'commerce',
    name: 'Commerce',
    family: 'Dynamics365',
    product_group: 'ERPStandard',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 90, file_gb: 80 },
    accrual: { db_gb: 5, file_gb: 5 },
    accrues_capacity: true
  },
  {
    id: 'finance',
    name: 'Finance',
    family: 'Dynamics365',
    product_group: 'ERPStandard',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 90, file_gb: 80 },
    accrual: { db_gb: 5, file_gb: 5 },
    accrues_capacity: true
  },
  {
    id: 'project-ops',
    name: 'Project Operations',
    family: 'Dynamics365',
    product_group: 'ERPStandard',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 90, file_gb: 80 },
    accrual: { db_gb: 5, file_gb: 5 },
    accrues_capacity: true
  },
  {
    id: 'scm',
    name: 'Supply Chain Mgmt',
    family: 'Dynamics365',
    product_group: 'ERPStandard',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 90, file_gb: 80 },
    accrual: { db_gb: 5, file_gb: 5 },
    accrues_capacity: true
  },
  {
    id: 'hr',
    name: 'Human Resources',
    family: 'Dynamics365',
    product_group: 'ERPStandard',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 90, file_gb: 80 },
    accrual: { db_gb: 1, file_gb: 2 },
    accrues_capacity: true
  },
  // D365 CRM
  {
    id: 'sales-ent',
    name: 'Sales Enterprise',
    family: 'Dynamics365',
    product_group: 'SalesEnterprise',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 30, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 2 },
    accrues_capacity: true
  },
  {
    id: 'sales-premium',
    name: 'Sales Premium',
    family: 'Dynamics365',
    product_group: 'SalesPremium',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 30, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 2 },
    accrues_capacity: true
  },
  {
    id: 'cs-ent',
    name: 'Customer Service Enterprise',
    family: 'Dynamics365',
    product_group: 'CustomerServiceEnterprise',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 30, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 2 },
    accrues_capacity: true
  },
  {
    id: 'cs-premium',
    name: 'Customer Service Premium',
    family: 'Dynamics365',
    product_group: 'CustomerServicePremium',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 30, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 35 },
    accrues_capacity: true
  },
  {
    id: 'field-service',
    name: 'Field Service',
    family: 'Dynamics365',
    product_group: 'FieldService',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 30, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 2 },
    accrues_capacity: true
  },
  {
    id: 'contact-center',
    name: 'Contact Center Voice',
    family: 'Dynamics365',
    product_group: 'ContactCenter',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 30, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 35 },
    accrues_capacity: true
  },
  {
    id: 'sales-pro',
    name: 'Sales Professional',
    family: 'Dynamics365',
    product_group: 'SalesProfessional',
    license_type: 'Attach',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 0, file_gb: 0 },
    accrues_capacity: false
  },
  {
    id: 'cs-pro',
    name: 'CS Professional',
    family: 'Dynamics365',
    product_group: 'CustomerServiceProfessional',
    license_type: 'Attach',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 0, file_gb: 0 },
    accrues_capacity: false
  },
  // Power Platform Premium
  {
    id: 'pa-premium',
    name: 'Power Apps Premium',
    family: 'PowerApps',
    product_group: 'PowerAppsPremium',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 20, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 2 },
    accrues_capacity: true
  },
  {
    id: 'pautom-premium',
    name: 'Power Automate Premium',
    family: 'PowerAutomate',
    product_group: 'PowerAutomatePremium',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 20, file_gb: 40 },
    accrual: { db_gb: 0.25, file_gb: 2 },
    accrues_capacity: true
  },
  // Power Platform Workload
  {
    id: 'pa-perapp',
    name: 'Power Apps per app',
    family: 'PowerApps',
    product_group: 'PowerAppsPerApp',
    license_type: 'PerApp',
    eligible_for_default: true,
    default: { db_gb: 15, file_gb: 20 },
    accrual: { db_gb: 0.05, file_gb: 0.4 },
    accrues_capacity: true
  },
  {
    id: 'pautom-process',
    name: 'Power Automate Process',
    family: 'PowerAutomate',
    product_group: 'PowerAutomateProcess',
    license_type: 'PerFlow',
    eligible_for_default: true,
    default: { db_gb: 15, file_gb: 20 },
    accrual: { db_gb: 0, file_gb: 0 },
    accrues_capacity: false
  },
  {
    id: 'copilot-studio',
    name: 'Copilot Studio',
    family: 'CopilotStudio',
    product_group: 'CopilotStudio',
    license_type: 'PerBot',
    eligible_for_default: true,
    default: { db_gb: 15, file_gb: 20 },
    accrual: { db_gb: 0, file_gb: 0 },
    accrues_capacity: false
  },
  // Process Mining (with 100 GB tenant cap)
  {
    id: 'process-mining',
    name: 'Process Mining',
    family: 'PowerAutomate',
    product_group: 'ProcessMining',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 10, file_gb: 50 },
    accrues_capacity: true,
    tenant_cap_db_gb: 100
  },
  // D365 Customer Insights
  {
    id: 'ci-base',
    name: 'Customer Insights (Base or Attach)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'Base',
    eligible_for_default: true,
    default: { db_gb: 45, file_gb: 60 },
    accrual: { db_gb: 0, file_gb: 0 },
    accrues_capacity: false
  },
  {
    id: 'ci-interacted-t1',
    name: 'Interacted People Pack T1 (5K)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 1, file_gb: 2 },
    accrues_capacity: true,
    requires_base: 'ci-base'
  },
  {
    id: 'ci-interacted-t2',
    name: 'Interacted People Pack T2 (10K)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 1, file_gb: 2 },
    accrues_capacity: true,
    requires_base: 'ci-base'
  },
  {
    id: 'ci-interacted-t3',
    name: 'Interacted People Pack T3 (50K)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 1, file_gb: 2 },
    accrues_capacity: true,
    requires_base: 'ci-base'
  },
  {
    id: 'ci-unified-t1',
    name: 'Unified People Pack T1 (100K)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 15, file_gb: 20 },
    accrues_capacity: true,
    requires_base: 'ci-base'
  },
  {
    id: 'ci-unified-t2',
    name: 'Unified People Pack T2 (100K)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 15, file_gb: 20 },
    accrues_capacity: true,
    requires_base: 'ci-base'
  },
  {
    id: 'ci-unified-t3',
    name: 'Unified People Pack T3 (100K)',
    family: 'Dynamics365',
    product_group: 'CustomerInsights',
    license_type: 'CapacityPack',
    eligible_for_default: false,
    default: { db_gb: 0, file_gb: 0 },
    accrual: { db_gb: 15, file_gb: 20 },
    accrues_capacity: true,
    requires_base: 'ci-base'
  }
];

// Group SKUs into display tiers for UI (preserving existing visual structure)
const PRODUCT_TIERS = [
  {
    id: 'erp-premium',
    name: 'D365 ERP Premium',
    priority: 1,
    skuIds: ['finance-premium', 'scm-premium']
  },
  {
    id: 'erp-standard',
    name: 'D365 ERP Standard',
    priority: 2,
    skuIds: ['commerce', 'finance', 'project-ops', 'scm', 'hr']
  },
  {
    id: 'crm',
    name: 'D365 CRM',
    priority: 3,
    skuIds: ['sales-ent', 'sales-premium', 'cs-ent', 'cs-premium', 'field-service', 'contact-center', 'sales-pro', 'cs-pro']
  },
  {
    id: 'pp-premium',
    name: 'Power Platform Premium',
    priority: 4,
    skuIds: ['pa-premium', 'pautom-premium']
  },
  {
    id: 'pp-workload',
    name: 'Power Platform Workload',
    priority: 5,
    skuIds: ['pa-perapp', 'pautom-process', 'copilot-studio', 'process-mining']
  },
  {
    id: 'customer-insights',
    name: 'D365 Customer Insights',
    priority: 6,
    defaultCollapsed: true,
    skuIds: ['ci-base', 'ci-interacted-t1', 'ci-interacted-t2', 'ci-interacted-t3', 'ci-unified-t1', 'ci-unified-t2', 'ci-unified-t3']
  },
];

// Create lookup for SKUs by ID
const SKU_MAP = SKUS.reduce((acc, sku) => ({ ...acc, [sku.id]: sku }), {});

// Get tier-level defaults by taking max within tier
const getTierDefaults = (tier) => {
  const skus = tier.skuIds.map(id => SKU_MAP[id]).filter(s => s && s.eligible_for_default);
  return {
    dbDefault: skus.reduce((max, s) => Math.max(max, s.default.db_gb), 0),
    fileDefault: skus.reduce((max, s) => Math.max(max, s.default.file_gb), 0)
  };
};

const tierColors = {
  'erp-premium': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  'erp-standard': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  'crm': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  'pp-premium': { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  'pp-workload': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  'customer-insights': { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
};

const formatCapacity = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} TB`;
  if (value >= 100) return `${Math.round(value)} GB`;
  return `${value.toFixed(1)} GB`;
};

// Tooltip component for educational content
const Tooltip = ({ text, children }) => {
  return (
    <span className="relative group inline-flex items-center">
      {children}
      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48 p-2 text-xs text-white bg-gray-800 rounded shadow-lg">
        {text}
        <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></span>
      </span>
    </span>
  );
};

// Info icon for tooltips
const InfoIcon = ({ tooltip }) => (
  <Tooltip text={tooltip}>
    <span className="inline-flex items-center justify-center w-4 h-4 text-xs text-gray-400 hover:text-gray-600 cursor-help ml-1">
      ℹ️
    </span>
  </Tooltip>
);

const ProductRow = ({ sku, value, onChange, licenses }) => {
  const hasAccrual = sku.accrues_capacity && (sku.accrual.db_gb > 0 || sku.accrual.file_gb > 0);
  const isActive = value > 0;
  const isDisabled = sku.requires_base && !(licenses[sku.requires_base] > 0);
  
  // Determine unit label based on license type
  const unitLabel = sku.license_type === 'PerApp' ? 'apps' 
    : sku.license_type === 'PerFlow' ? 'flows'
    : sku.license_type === 'PerBot' ? 'bots'
    : sku.license_type === 'CapacityPack' ? 'packs'
    : 'users';
  
  return (
    <div className={`py-1.5 ${isActive ? 'bg-gray-50 -mx-2 px-2 rounded' : ''} ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          disabled={isDisabled}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 disabled:cursor-not-allowed"
        />
        <span className={`text-sm flex-1 ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'}`} title={isDisabled ? `Requires ${sku.requires_base} to be enabled` : ''}>
          {sku.name}
          {sku.tenant_cap_db_gb && (
            <span className="text-xs text-amber-600 ml-1">(capped)</span>
          )}
        </span>
        {isActive && hasAccrual && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="10000"
              value={value}
              onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-1.5 py-0.5 text-sm border border-gray-300 rounded text-center"
            />
            <span className="text-xs text-gray-400">{unitLabel}</span>
          </div>
        )}
        {isActive && !sku.accrues_capacity && (
          <span className="text-xs text-gray-400 italic">no accrual</span>
        )}
      </div>
      {isActive && hasAccrual && (
        <input
          type="range"
          min="1"
          max="500"
          value={Math.min(value, 500)}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1.5 mt-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      )}
    </div>
  );
};

const TierGroup = ({ tier, licenses, onLicenseChange, isHighest, isExpanded, onToggle }) => {
  const colors = tierColors[tier.id];
  const tierDefaults = getTierDefaults(tier);
  const skus = tier.skuIds.map(id => SKU_MAP[id]).filter(Boolean);
  
  // Count how many products are selected in this tier
  const selectedCount = skus.filter(sku => (licenses[sku.id] || 0) > 0).length;
  
  return (
    <div className={`rounded-lg border ${isHighest ? colors.border + ' ' + colors.light : 'border-gray-200 bg-white'} overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full px-3 py-2 ${isHighest ? colors.bg + ' text-white' : 'bg-gray-50 hover:bg-gray-100'} flex items-center justify-between text-left transition`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${isHighest ? 'text-white' : 'text-gray-700'}`}>
            {tier.name}
          </span>
          {isHighest && (
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">★ Active</span>
          )}
          {selectedCount > 0 && !isHighest && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{selectedCount} selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${isHighest ? 'text-white/80' : 'text-gray-500'}`}>
            {tierDefaults.dbDefault}GB / {tierDefaults.fileDefault}GB
          </span>
          <span className={`text-xs ${isHighest ? 'text-white/60' : 'text-gray-400'}`}>
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 py-2 space-y-1">
          {skus.map(sku => (
            <ProductRow
              key={sku.id}
              sku={sku}
              value={licenses[sku.id] || 0}
              onChange={(val) => onLicenseChange(sku.id, val)}
              licenses={licenses}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CapacityGauge = ({ label, defaultValue, perUserAccrualValue = 0, perAppAccrualValue = 0, perPackAccrualValue = 0, addonValue = 0, total, maxValue, color, tooltip }) => {
  const defaultPct = (defaultValue / maxValue) * 100;
  const perUserAccrualPct = (perUserAccrualValue / maxValue) * 100;
  const perAppAccrualPct = (perAppAccrualValue / maxValue) * 100;
  const perPackAccrualPct = (perPackAccrualValue / maxValue) * 100;
  const addonPct = (addonValue / maxValue) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-lg font-semibold text-gray-800">
          {label}
          {tooltip && <InfoIcon tooltip={tooltip} />}
        </span>
        <span className="text-2xl font-bold text-gray-900">{formatCapacity(total)}</span>
      </div>
      
      {/* Stacked bar */}
      <div className="h-8 bg-gray-200 rounded-lg overflow-hidden flex">
        {defaultValue > 0 && (
          <div 
            className={`${color} flex items-center justify-center text-white text-xs font-medium transition-all duration-300`}
            style={{ width: `${defaultPct}%` }}
          >
            {defaultPct > 15 && formatCapacity(defaultValue)}
          </div>
        )}
        {perUserAccrualValue > 0 && (
          <div 
            className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
            style={{ width: `${perUserAccrualPct}%` }}
          >
            {perUserAccrualPct > 15 && `+${formatCapacity(perUserAccrualValue)}`}
          </div>
        )}
        {perAppAccrualValue > 0 && (
          <div 
            className="bg-green-600 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
            style={{ width: `${perAppAccrualPct}%` }}
          >
            {perAppAccrualPct > 15 && `+${formatCapacity(perAppAccrualValue)}`}
          </div>
        )}
        {perPackAccrualValue > 0 && (
          <div 
            className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
            style={{ width: `${perPackAccrualPct}%` }}
          >
            {perPackAccrualPct > 15 && `+${formatCapacity(perPackAccrualValue)}`}
          </div>
        )}
        {addonValue > 0 && (
          <div 
            className="bg-amber-500 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
            style={{ width: `${addonPct}%` }}
          >
            {addonPct > 15 && `+${formatCapacity(addonValue)}`}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${color}`}></div>
          <span>Default: {formatCapacity(defaultValue)}</span>
        </div>
        {perUserAccrualValue > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-400"></div>
            <span>Per-user: {formatCapacity(perUserAccrualValue)}</span>
          </div>
        )}
        {perAppAccrualValue > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-600"></div>
            <span>Per-app: {formatCapacity(perAppAccrualValue)}</span>
          </div>
        )}
        {perPackAccrualValue > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Per-pack: {formatCapacity(perPackAccrualValue)}</span>
          </div>
        )}
        {addonValue > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Add-ons: {formatCapacity(addonValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Collapsible info panel for educational content
const InfoPanel = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-blue-100 transition"
      >
        <span className="text-sm font-medium text-blue-800 flex items-center gap-1">
          <span>ℹ️</span> {title}
        </span>
        <span className="text-blue-600">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="px-3 py-2 border-t border-blue-200 text-xs text-blue-800 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

// What's New panel for announcements with dismiss functionality
const WhatsNewPanel = ({ onDismiss }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <div className="bg-sky-50 border border-sky-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-sky-100 transition"
      >
        <span className="text-sm font-medium text-sky-800 flex items-center gap-2">
          <span>🆕</span> What's New: December 2025
          <span className="text-xs bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded font-semibold">NEW</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sky-600">{isOpen ? '▲' : '▼'}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-sky-400 hover:text-sky-600 text-lg leading-none"
            aria-label="Dismiss announcement"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </button>
      {isOpen && (
        <div className="px-3 py-2 border-t border-sky-200 text-xs text-sky-800 space-y-2">
          <p>Microsoft increased default Dataverse capacity across all product tiers effective December 1, 2025:</p>
          <ul className="list-disc list-inside space-y-1 ml-1">
            <li><strong>Power Platform Premium:</strong> 10 → 20 GB database, 20 → 40 GB file</li>
            <li><strong>Power Platform per-app/Copilot Studio:</strong> 5 → 15 GB database</li>
            <li><strong>D365 CRM:</strong> 10 → 30 GB database, 20 → 40 GB file</li>
            <li><strong>D365 ERP:</strong> Dataverse + Operations pools merged, +20 GB across the board</li>
          </ul>
          <p className="text-sky-600">No action required—capacity updates automatically in Power Platform Admin Center.</p>
          <p className="pt-1">
            <a 
              href="https://licensing.guide/blog/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sky-600 hover:text-sky-800 underline font-medium"
            >
              Read The Licensing Guide blog for latest info →
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default function DataverseCapacityCalculator() {
  const [licenses, setLicenses] = useState({ 'sales-ent': 10 });
  const [addons, setAddons] = useState({ db_gb: 0, file_gb: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(true);
  // Track which tier groups are expanded - default to first tier expanded on desktop, 
  // but keep Customer Insights collapsed by default
  const [expandedTiers, setExpandedTiers] = useState(() => {
    const initial = { 'erp-premium': true };
    // Don't expand tiers that have defaultCollapsed
    PRODUCT_TIERS.forEach(tier => {
      if (tier.defaultCollapsed) {
        initial[tier.id] = false;
      }
    });
    return initial;
  });
  
  // Track first visit and what's new dismissal using localStorage
  useEffect(() => {
    try {
      const hasVisited = localStorage.getItem('dataverse-calc-visited');
      if (!hasVisited) {
        setShowOnboarding(true);
        setSidebarOpen(true);
        localStorage.setItem('dataverse-calc-visited', 'true');
      }
      
      const whatsNewDismissed = localStorage.getItem('dataverse-calc-whats-new-dec2025-dismissed');
      if (whatsNewDismissed) {
        setShowWhatsNew(false);
      }
    } catch (e) {
      // localStorage may not be available in incognito mode or when disabled
    }
  }, []);
  
  const handleDismissWhatsNew = () => {
    setShowWhatsNew(false);
    try {
      localStorage.setItem('dataverse-calc-whats-new-dec2025-dismissed', 'true');
    } catch (e) {
      // localStorage may not be available
    }
  };
  
  const handleToggleTier = (tierId) => {
    setExpandedTiers(prev => ({ ...prev, [tierId]: !prev[tierId] }));
  };
  
  // Close sidebar on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);
  
  const handleLicenseChange = (skuId, value) => {
    setLicenses(prev => ({ ...prev, [skuId]: value }));
  };
  
  const handleAddonChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setAddons(prev => ({ ...prev, [type]: numValue }));
  };
  
  const calculation = useMemo(() => {
    let highestTier = null;
    let dbPerUserAccrual = 0;
    let filePerUserAccrual = 0;
    let dbPerAppAccrual = 0;
    let filePerAppAccrual = 0;
    let dbPerPackAccrual = 0;
    let filePerPackAccrual = 0;
    const skuUsage = {}; // Track usage for tenant caps
    const breakdown = []; // Per-SKU breakdown for display
    
    // Check if Customer Insights base is licensed
    const hasCustomerInsightsBase = (licenses['ci-base'] || 0) > 0;
    
    // Calculate accruals and find highest tier
    for (const tier of PRODUCT_TIERS) {
      for (const skuId of tier.skuIds) {
        const sku = SKU_MAP[skuId];
        if (!sku) continue;
        
        const count = licenses[skuId] || 0;
        if (count > 0) {
          // Track highest tier for default capacity
          if (sku.eligible_for_default) {
            if (!highestTier || tier.priority < highestTier.priority) {
              highestTier = tier;
            }
          }
          
          // Skip CI pack capacity if CI base is not licensed
          if (sku.requires_base === 'ci-base' && !hasCustomerInsightsBase) {
            continue;
          }
          
          // Calculate accrual (only if accrues_capacity is true)
          if (sku.accrues_capacity) {
            let addDb = count * sku.accrual.db_gb;
            const addFile = count * sku.accrual.file_gb;
            
            // Apply tenant cap for SKUs like Process Mining
            if (sku.tenant_cap_db_gb !== undefined) {
              const existing = skuUsage[sku.id] || 0;
              addDb = Math.min(addDb, Math.max(0, sku.tenant_cap_db_gb - existing));
              skuUsage[sku.id] = existing + addDb;
            }
            
            if (addDb > 0 || addFile > 0) {
              // Separate per-app licenses, per-pack licenses, and per-user licenses
              const isPerApp = sku.license_type === 'PerApp';
              const isPerPack = sku.license_type === 'CapacityPack';
              if (isPerApp) {
                dbPerAppAccrual += addDb;
                filePerAppAccrual += addFile;
              } else if (isPerPack) {
                dbPerPackAccrual += addDb;
                filePerPackAccrual += addFile;
              } else {
                dbPerUserAccrual += addDb;
                filePerUserAccrual += addFile;
              }
              
              breakdown.push({
                sku,
                count,
                db: addDb,
                file: addFile,
                isPack: isPerPack,
                capped: sku.tenant_cap_db_gb !== undefined && addDb < count * sku.accrual.db_gb
              });
            }
          }
        }
      }
    }
    
    // Get default capacity from highest tier
    const tierDefaults = highestTier ? getTierDefaults(highestTier) : { dbDefault: 0, fileDefault: 0 };
    const dbDefault = tierDefaults.dbDefault;
    const fileDefault = tierDefaults.fileDefault;
    
    // Add-ons are pooled directly
    const dbAddon = addons.db_gb;
    const fileAddon = addons.file_gb;
    
    return {
      highestTier,
      dbDefault,
      fileDefault,
      dbPerUserAccrual,
      filePerUserAccrual,
      dbPerAppAccrual,
      filePerAppAccrual,
      dbPerPackAccrual,
      filePerPackAccrual,
      dbAddon,
      fileAddon,
      dbTotal: dbDefault + dbPerUserAccrual + dbPerAppAccrual + dbPerPackAccrual + dbAddon,
      fileTotal: fileDefault + filePerUserAccrual + filePerAppAccrual + filePerPackAccrual + fileAddon,
      breakdown
    };
  }, [licenses, addons]);
  
  const maxDb = Math.max(150, calculation.dbTotal * 1.1);
  const maxFile = Math.max(150, calculation.fileTotal * 1.1);
  
  return (
    <div className="h-screen bg-gray-100 flex flex-col lg:flex-row relative">
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
        role="button"
        tabIndex={sidebarOpen ? 0 : -1}
        aria-label="Close sidebar"
      />
      
      {/* Left Panel - Product Selection (Collapsible Sidebar on Mobile) */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-80 bg-white border-r border-gray-200 
          overflow-y-auto p-4 flex-shrink-0 h-full
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* First-visit onboarding banner */}
        {showOnboarding && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium">👋 Welcome!</p>
                <p className="text-xs text-blue-600 mt-1">
                  Tap products to add them, then close this panel to see your capacity results.
                </p>
              </div>
              <button 
                onClick={() => setShowOnboarding(false)}
                className="text-blue-400 hover:text-blue-600 text-lg leading-none"
                aria-label="Close onboarding banner"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        <h1 className="text-lg font-bold text-gray-900 mb-1">Dataverse Capacity Calculator</h1>
        <p className="text-xs text-gray-500 mb-4">
          Brought to you by <a href="https://licensing.guide" target="_blank" rel="noopener noreferrer nofollow" className="text-blue-600 hover:underline">licensing.guide</a>
        </p>
        
        {/* Educational info panel */}
        <InfoPanel title="How Capacity Works">
          <p><strong>Tenant Pool:</strong> Dataverse capacity is pooled at the tenant level and shared across all environments.</p>
          <p><strong>Default Capacity:</strong> Granted once per tenant from your highest-tier eligible license. Does not stack.</p>
          <p><strong>Per-user Accrual:</strong> Additional capacity that stacks based on user/app/pack counts.</p>
          <p><strong>Add-ons:</strong> Purchased separately in 1 GB increments, pooled tenant-wide.</p>
        </InfoPanel>
        
        {/* What's New December 2025 announcement - only shown on mobile in sidebar */}
        {showWhatsNew && (
          <div className="lg:hidden">
            <WhatsNewPanel onDismiss={handleDismissWhatsNew} />
          </div>
        )}
        
        <div className="space-y-3">
          {PRODUCT_TIERS.map(tier => (
            <TierGroup
              key={tier.id}
              tier={tier}
              licenses={licenses}
              onLicenseChange={handleLicenseChange}
              isHighest={calculation.highestTier?.id === tier.id}
              isExpanded={expandedTiers[tier.id] || false}
              onToggle={() => handleToggleTier(tier.id)}
            />
          ))}
        </div>
        
        {/* Capacity Add-ons Section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 mb-3">
            <span className="text-sm font-semibold text-gray-700">Capacity Add-ons</span>
            <InfoIcon tooltip="Add-on capacity purchased separately. Each unit adds 1 GB to the tenant pool." />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 flex-1">Database (GB)</label>
              <input
                type="number"
                min="0"
                max="10000"
                value={addons.db_gb}
                onChange={(e) => handleAddonChange('db_gb', e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 flex-1">File (GB)</label>
              <input
                type="number"
                min="0"
                max="10000"
                value={addons.file_gb}
                onChange={(e) => handleAddonChange('file_gb', e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => { setLicenses({}); setAddons({ db_gb: 0, file_gb: 0 }); }}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
          >
            Reset all
          </button>
        </div>
      </div>
      
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed bottom-6 left-6 z-50 lg:hidden flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200"
      >
        {sidebarOpen ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-medium">Close</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="text-sm font-medium">Products</span>
          </>
        )}
      </button>
      
      {/* Right Panel - Capacity Metrics */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-xl">
          {/* What's New December 2025 announcement - shown on desktop in right panel */}
          {showWhatsNew && (
            <div className="hidden lg:block mb-6">
              <WhatsNewPanel onDismiss={handleDismissWhatsNew} />
            </div>
          )}
          
          {calculation.highestTier ? (
            <>
              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${tierColors[calculation.highestTier.id].light} ${tierColors[calculation.highestTier.id].text} text-sm font-medium`}>
                  <span>★</span>
                  <span>{calculation.highestTier.name}</span>
                  <span className="text-gray-400">determines default capacity</span>
                </div>
              </div>
              
              <CapacityGauge
                label="Database Capacity"
                defaultValue={calculation.dbDefault}
                perUserAccrualValue={calculation.dbPerUserAccrual}
                perAppAccrualValue={calculation.dbPerAppAccrual}
                perPackAccrualValue={calculation.dbPerPackAccrual}
                addonValue={calculation.dbAddon}
                total={calculation.dbTotal}
                maxValue={maxDb}
                color={tierColors[calculation.highestTier.id].bg}
                tooltip="Total Dataverse database storage pooled at tenant level."
              />
              
              <CapacityGauge
                label="File Capacity"
                defaultValue={calculation.fileDefault}
                perUserAccrualValue={calculation.filePerUserAccrual}
                perAppAccrualValue={calculation.filePerAppAccrual}
                perPackAccrualValue={calculation.filePerPackAccrual}
                addonValue={calculation.fileAddon}
                total={calculation.fileTotal}
                maxValue={maxFile}
                color={tierColors[calculation.highestTier.id].bg}
                tooltip="Total Dataverse file/attachment storage pooled at tenant level."
              />
              
              {/* Breakdown table */}
              <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-1">
                  <span className="font-semibold text-gray-700 text-sm">Capacity Breakdown</span>
                  <InfoIcon tooltip="Detailed breakdown of capacity sources. Default capacity comes from highest tier. Per-user accrual stacks." />
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-4 font-medium text-gray-600">Source</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-600">Database</th>
                      <th className="text-right py-2 px-4 font-medium text-gray-600">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 px-4 text-gray-700">
                        Default ({calculation.highestTier.name})
                        <InfoIcon tooltip="One-time default capacity from your highest-tier license. Does not stack across products." />
                      </td>
                      <td className="py-2 px-4 text-right text-gray-900">{calculation.dbDefault} GB</td>
                      <td className="py-2 px-4 text-right text-gray-900">{calculation.fileDefault} GB</td>
                    </tr>
                    {calculation.breakdown.filter(({ isPack }) => !isPack).map(({ sku, count, db, file, capped }) => (
                      <tr key={sku.id} className="border-b border-gray-100">
                        <td className="py-2 px-4 text-gray-600">
                          {sku.name} × {count}
                          {capped && (
                            <span className="text-xs text-amber-600 ml-1">(capped at {sku.tenant_cap_db_gb} GB)</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-700">+{db.toFixed(1)} GB</td>
                        <td className="py-2 px-4 text-right text-gray-700">+{file.toFixed(1)} GB</td>
                      </tr>
                    ))}
                    {calculation.breakdown.some(({ isPack }) => isPack) && (
                      <>
                        <tr className="bg-orange-50">
                          <td colSpan="3" className="py-2 px-4 text-xs font-semibold text-orange-800 uppercase tracking-wide">
                            Per-pack contributions (add-on capacity)
                          </td>
                        </tr>
                        {calculation.breakdown.filter(({ isPack }) => isPack).map(({ sku, count, db, file, capped }) => (
                          <tr key={sku.id} className="border-b border-gray-100">
                            <td className="py-2 px-4 text-gray-600">
                              {sku.name} × {count}
                              {capped && (
                                <span className="text-xs text-amber-600 ml-1">(capped at {sku.tenant_cap_db_gb} GB)</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right text-gray-700">+{db.toFixed(1)} GB</td>
                            <td className="py-2 px-4 text-right text-gray-700">+{file.toFixed(1)} GB</td>
                          </tr>
                        ))}
                      </>
                    )}
                    {(calculation.dbAddon > 0 || calculation.fileAddon > 0) && (
                      <tr className="border-b border-gray-100 bg-amber-50">
                        <td className="py-2 px-4 text-amber-800">
                          Capacity Add-ons
                          <InfoIcon tooltip="Purchased add-on capacity, pooled tenant-wide." />
                        </td>
                        <td className="py-2 px-4 text-right text-amber-800">+{calculation.dbAddon} GB</td>
                        <td className="py-2 px-4 text-right text-amber-800">+{calculation.fileAddon} GB</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-2 px-4 text-gray-900">Total</td>
                      <td className="py-2 px-4 text-right text-gray-900">{formatCapacity(calculation.dbTotal)}</td>
                      <td className="py-2 px-4 text-right text-gray-900">{formatCapacity(calculation.fileTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2 hidden lg:block">←</div>
                <div className="text-4xl mb-2 lg:hidden">📋</div>
                <p>Select products to calculate capacity</p>
                <p className="text-sm mt-2 hidden lg:block">Choose from the product tiers on the left</p>
                <p className="text-sm mt-2 lg:hidden">Tap the menu button below to select products</p>
              </div>
            </div>
          )}
          
          {/* Notes */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Notes:</strong> Default capacity granted once per tenant — highest tier wins. 
            Per-user accrual stacks across all products. Log capacity (2-3 GB) not shown. 
            Process Mining has a 100 GB tenant cap on DB accrual.
            Verify actual entitlements in Power Platform Admin Center.
          </div>
          
          {/* Version indicator */}
          <div className="mt-4 text-center text-xs text-gray-400">
            Capacity values: December 2025
          </div>
        </div>
      </div>
    </div>
  );
}
