import React, { useState, useMemo } from 'react';

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
    accrual: { db_gb: 0, file_gb: 0 },
    accrues_capacity: false
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

const ProductRow = ({ sku, value, onChange }) => {
  const hasAccrual = sku.accrues_capacity && (sku.accrual.db_gb > 0 || sku.accrual.file_gb > 0);
  const isActive = value > 0;
  
  // Determine unit label based on license type
  const unitLabel = sku.license_type === 'PerApp' ? 'apps' 
    : sku.license_type === 'PerFlow' ? 'flows'
    : sku.license_type === 'PerBot' ? 'bots'
    : sku.license_type === 'CapacityPack' ? 'packs'
    : 'users';
  
  return (
    <div className={`py-1.5 ${isActive ? 'bg-gray-50 -mx-2 px-2 rounded' : ''}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
        />
        <span className={`text-sm flex-1 ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
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

const TierGroup = ({ tier, licenses, onLicenseChange, isHighest }) => {
  const colors = tierColors[tier.id];
  const tierDefaults = getTierDefaults(tier);
  const skus = tier.skuIds.map(id => SKU_MAP[id]).filter(Boolean);
  
  return (
    <div className={`rounded-lg border ${isHighest ? colors.border + ' ' + colors.light : 'border-gray-200 bg-white'} overflow-hidden`}>
      <div className={`px-3 py-2 ${isHighest ? colors.bg + ' text-white' : 'bg-gray-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`font-semibold text-sm ${isHighest ? 'text-white' : 'text-gray-700'}`}>
            {tier.name}
          </span>
          {isHighest && (
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">★ Active</span>
          )}
        </div>
        <span className={`text-xs ${isHighest ? 'text-white/80' : 'text-gray-500'}`}>
          {tierDefaults.dbDefault}GB / {tierDefaults.fileDefault}GB
        </span>
      </div>
      <div className="px-3 py-2 space-y-1">
        {skus.map(sku => (
          <ProductRow
            key={sku.id}
            sku={sku}
            value={licenses[sku.id] || 0}
            onChange={(val) => onLicenseChange(sku.id, val)}
          />
        ))}
      </div>
    </div>
  );
};

const CapacityGauge = ({ label, defaultValue, accrualValue, addonValue = 0, total, maxValue, color, tooltip }) => {
  const defaultPct = (defaultValue / maxValue) * 100;
  const accrualPct = (accrualValue / maxValue) * 100;
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
        {accrualValue > 0 && (
          <div 
            className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium transition-all duration-300"
            style={{ width: `${accrualPct}%` }}
          >
            {accrualPct > 15 && `+${formatCapacity(accrualValue)}`}
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
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span>Per-user: {formatCapacity(accrualValue)}</span>
        </div>
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

export default function DataverseCapacityCalculator() {
  const [licenses, setLicenses] = useState({});
  const [addons, setAddons] = useState({ db_gb: 0, file_gb: 0 });
  
  const handleLicenseChange = (skuId, value) => {
    setLicenses(prev => ({ ...prev, [skuId]: value }));
  };
  
  const handleAddonChange = (type, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setAddons(prev => ({ ...prev, [type]: numValue }));
  };
  
  const calculation = useMemo(() => {
    let highestTier = null;
    let dbAccrual = 0;
    let fileAccrual = 0;
    const skuUsage = {}; // Track usage for tenant caps
    const breakdown = []; // Per-SKU breakdown for display
    
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
              dbAccrual += addDb;
              fileAccrual += addFile;
              breakdown.push({
                sku,
                count,
                db: addDb,
                file: addFile,
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
      dbAccrual,
      fileAccrual,
      dbAddon,
      fileAddon,
      dbTotal: dbDefault + dbAccrual + dbAddon,
      fileTotal: fileDefault + fileAccrual + fileAddon,
      breakdown
    };
  }, [licenses, addons]);
  
  const maxDb = Math.max(150, calculation.dbTotal * 1.1);
  const maxFile = Math.max(150, calculation.fileTotal * 1.1);
  
  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Left Panel - Product Selection */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 overflow-y-auto p-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Dataverse Capacity</h1>
        <p className="text-xs text-gray-500 mb-4">December 2025 values</p>
        
        {/* Educational info panel */}
        <InfoPanel title="How Capacity Works">
          <p><strong>Tenant Pool:</strong> Dataverse capacity is pooled at the tenant level and shared across all environments.</p>
          <p><strong>Default Capacity:</strong> Granted once per tenant from your highest-tier eligible license. Does not stack.</p>
          <p><strong>Per-user Accrual:</strong> Additional capacity that stacks based on user/app/pack counts.</p>
          <p><strong>Add-ons:</strong> Purchased separately in 1 GB increments, pooled tenant-wide.</p>
        </InfoPanel>
        
        <div className="space-y-3">
          {PRODUCT_TIERS.map(tier => (
            <TierGroup
              key={tier.id}
              tier={tier}
              licenses={licenses}
              onLicenseChange={handleLicenseChange}
              isHighest={calculation.highestTier?.id === tier.id}
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
      
      {/* Right Panel - Capacity Metrics */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-xl">
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
                accrualValue={calculation.dbAccrual}
                addonValue={calculation.dbAddon}
                total={calculation.dbTotal}
                maxValue={maxDb}
                color={tierColors[calculation.highestTier.id].bg}
                tooltip="Total Dataverse database storage pooled at tenant level."
              />
              
              <CapacityGauge
                label="File Capacity"
                defaultValue={calculation.fileDefault}
                accrualValue={calculation.fileAccrual}
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
                    {calculation.breakdown.map(({ sku, count, db, file, capped }) => (
                      <tr key={sku.id} className="border-b border-gray-100">
                        <td className="py-2 px-4 text-gray-600">
                          {sku.name} × {count}
                          {capped && (
                            <span className="text-xs text-amber-600 ml-1">(capped at {sku.tenant_cap_db_gb} GB)</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-right text-gray-700">+{db.toFixed(1)} GB</td>
                        <td className="py-2 px-4 text-right text-gray-700">+{file.toFixed(0)} GB</td>
                      </tr>
                    ))}
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
                <div className="text-4xl mb-2">←</div>
                <p>Select products to calculate capacity</p>
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
        </div>
      </div>
    </div>
  );
}
