import React, { useState, useMemo } from 'react';

// Product definitions with capacity values
// Source: Microsoft Dataverse capacity documentation (verified December 2025)
// Values may change - verify at https://learn.microsoft.com/en-us/power-platform/admin/capacity-storage
const PRODUCT_TIERS = [
  {
    id: 'erp-premium',
    name: 'D365 ERP Premium',
    dbDefault: 125,
    fileDefault: 110,
    priority: 1,
    description: 'Highest tier - Finance Premium and SCM Premium',
    products: [
      { id: 'finance-premium', name: 'Finance Premium', dbPerUser: 10, filePerUser: 10, tooltip: 'Dynamics 365 Finance Premium - 10 GB DB + 10 GB File per user' },
      { id: 'scm-premium', name: 'SCM Premium', dbPerUser: 10, filePerUser: 10, tooltip: 'Dynamics 365 Supply Chain Management Premium - 10 GB DB + 10 GB File per user' },
    ]
  },
  {
    id: 'erp-standard',
    name: 'D365 ERP Standard',
    dbDefault: 90,
    fileDefault: 80,
    priority: 2,
    description: 'Standard ERP products including Finance, SCM, Commerce',
    products: [
      { id: 'commerce', name: 'Commerce', dbPerUser: 5, filePerUser: 5, tooltip: 'Dynamics 365 Commerce - 5 GB DB + 5 GB File per user' },
      { id: 'finance', name: 'Finance', dbPerUser: 5, filePerUser: 5, tooltip: 'Dynamics 365 Finance - 5 GB DB + 5 GB File per user' },
      { id: 'project-ops', name: 'Project Operations', dbPerUser: 5, filePerUser: 5, tooltip: 'Dynamics 365 Project Operations - 5 GB DB + 5 GB File per user' },
      { id: 'scm', name: 'Supply Chain Management', dbPerUser: 5, filePerUser: 5, tooltip: 'Dynamics 365 Supply Chain Management - 5 GB DB + 5 GB File per user' },
      { id: 'hr', name: 'Human Resources', dbPerUser: 1, filePerUser: 2, tooltip: 'Dynamics 365 Human Resources - 1 GB DB + 2 GB File per user' },
    ]
  },
  {
    id: 'crm',
    name: 'D365 CRM',
    dbDefault: 30,
    fileDefault: 40,
    priority: 3,
    description: 'CRM applications including Sales and Customer Service',
    products: [
      { id: 'sales-ent', name: 'Sales Enterprise', dbPerUser: 0.25, filePerUser: 2, tooltip: 'Dynamics 365 Sales Enterprise - 0.25 GB DB + 2 GB File per user' },
      { id: 'sales-premium', name: 'Sales Premium', dbPerUser: 0.25, filePerUser: 2, tooltip: 'Dynamics 365 Sales Premium - 0.25 GB DB + 2 GB File per user' },
      { id: 'cs-ent', name: 'Customer Service Enterprise', dbPerUser: 0.25, filePerUser: 2, tooltip: 'Dynamics 365 Customer Service Enterprise - 0.25 GB DB + 2 GB File per user' },
      { id: 'cs-premium', name: 'Customer Service Premium', dbPerUser: 0.25, filePerUser: 35, tooltip: 'Dynamics 365 Customer Service Premium - 0.25 GB DB + 35 GB File per user (includes voice recording storage)' },
      { id: 'field-service', name: 'Field Service', dbPerUser: 0.25, filePerUser: 2, tooltip: 'Dynamics 365 Field Service - 0.25 GB DB + 2 GB File per user' },
      { id: 'contact-center', name: 'Contact Center Voice', dbPerUser: 0.25, filePerUser: 35, tooltip: 'Dynamics 365 Contact Center Voice - 0.25 GB DB + 35 GB File per user (includes voice recording storage)' },
      { id: 'sales-pro', name: 'Sales Professional', dbPerUser: 0, filePerUser: 0, noAccrual: true, tooltip: 'Dynamics 365 Sales Professional - No per-user capacity accrual' },
      { id: 'cs-pro', name: 'CS Professional', dbPerUser: 0, filePerUser: 0, noAccrual: true, tooltip: 'Dynamics 365 Customer Service Professional - No per-user capacity accrual' },
    ]
  },
  {
    id: 'pp-premium',
    name: 'Power Platform Premium',
    dbDefault: 20,
    fileDefault: 40,
    priority: 4,
    description: 'Power Apps and Power Automate Premium licenses',
    products: [
      { id: 'pa-premium', name: 'Power Apps Premium', dbPerUser: 0.25, filePerUser: 2, tooltip: 'Power Apps Premium - 0.25 GB DB + 2 GB File per user' },
      { id: 'pautom-premium', name: 'Power Automate Premium', dbPerUser: 0.25, filePerUser: 2, tooltip: 'Power Automate Premium - 0.25 GB DB + 2 GB File per user' },
    ]
  },
  {
    id: 'pp-workload',
    name: 'Power Platform Workload',
    dbDefault: 15,
    fileDefault: 20,
    priority: 5,
    description: 'Per-app and process-based licenses',
    products: [
      { id: 'pa-perapp', name: 'Power Apps per app', dbPerApp: 0.05, filePerApp: 0.4, tooltip: 'Power Apps per app - 50 MB DB + 400 MB File per app license' },
      { id: 'pautom-process', name: 'Power Automate Process', dbPerUser: 0, filePerUser: 0, noAccrual: true, tooltip: 'Power Automate Process - No per-user capacity accrual' },
      { id: 'copilot-studio', name: 'Copilot Studio', dbPerUser: 0, filePerUser: 0, noAccrual: true, tooltip: 'Copilot Studio - No per-user capacity accrual' },
    ]
  },
];

const tierColors = {
  'erp-premium': { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', hover: 'hover:bg-purple-50' },
  'erp-standard': { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', hover: 'hover:bg-indigo-50' },
  'crm': { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', hover: 'hover:bg-blue-50' },
  'pp-premium': { bg: 'bg-teal-500', light: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', hover: 'hover:bg-teal-50' },
  'pp-workload': { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', hover: 'hover:bg-green-50' },
};

const formatCapacity = (value) => {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} TB`;
  if (value >= 100) return `${Math.round(value)} GB`;
  return `${value.toFixed(1)} GB`;
};

const Tooltip = ({ text, children }) => (
  <div className="group relative inline-block">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-48 text-center pointer-events-none">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const ProductRow = ({ product, value, onChange }) => {
  const hasAccrual = !product.noAccrual && (
    (product.dbPerUser > 0 || product.filePerUser > 0) ||
    (product.dbPerApp > 0 || product.filePerApp > 0)
  );
  const isPerApp = product.dbPerApp !== undefined || product.filePerApp !== undefined;
  const isActive = value > 0;
  
  return (
    <div className={`py-2 transition-all duration-200 ${isActive ? 'bg-gray-50 -mx-2 px-2 rounded-lg' : ''}`}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onChange(e.target.checked ? 1 : 0)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
        />
        <Tooltip text={product.tooltip}>
          <span className={`text-sm flex-1 cursor-help ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'} hover:text-blue-600`}>
            {product.name}
          </span>
        </Tooltip>
        {isActive && hasAccrual && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="10000"
              value={value}
              onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-xs text-gray-400">{isPerApp ? 'apps' : 'users'}</span>
          </div>
        )}
        {isActive && product.noAccrual && (
          <span className="text-xs text-gray-400 italic bg-gray-100 px-2 py-0.5 rounded">no accrual</span>
        )}
      </div>
      {isActive && hasAccrual && (
        <input
          type="range"
          min="1"
          max="500"
          value={Math.min(value, 500)}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 mt-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      )}
    </div>
  );
};

const TierGroup = ({ tier, licenses, onLicenseChange, isHighest }) => {
  const colors = tierColors[tier.id];
  
  return (
    <div className={`rounded-xl border-2 transition-all duration-300 ${isHighest ? colors.border + ' ' + colors.light + ' shadow-md' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'} overflow-hidden`}>
      <div className={`px-4 py-3 ${isHighest ? colors.bg + ' text-white' : 'bg-gray-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Tooltip text={tier.description}>
            <span className={`font-semibold text-sm cursor-help ${isHighest ? 'text-white' : 'text-gray-700'}`}>
              {tier.name}
            </span>
          </Tooltip>
          {isHighest && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full pulse-subtle">★ Active</span>
          )}
        </div>
        <span className={`text-xs ${isHighest ? 'text-white/80' : 'text-gray-500'}`}>
          {tier.dbDefault}GB / {tier.fileDefault}GB
        </span>
      </div>
      <div className="px-4 py-3 space-y-1">
        {tier.products.map(product => (
          <ProductRow
            key={product.id}
            product={product}
            value={licenses[product.id] || 0}
            onChange={(val) => onLicenseChange(product.id, val)}
          />
        ))}
      </div>
    </div>
  );
};

const CapacityGauge = ({ label, defaultValue, accrualValue, perAppAccrualValue, total, maxValue, color, icon }) => {
  const defaultPct = (defaultValue / maxValue) * 100;
  const accrualPct = (accrualValue / maxValue) * 100;
  const perAppAccrualPct = (perAppAccrualValue / maxValue) * 100;
  
  return (
    <div className="mb-8 fade-in">
      <div className="flex justify-between items-baseline mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="text-lg font-semibold text-gray-800">{label}</span>
        </div>
        <span className="text-3xl font-bold text-gray-900">{formatCapacity(total)}</span>
      </div>
      
      {/* Stacked bar */}
      <div className="h-10 bg-gray-200 rounded-xl overflow-hidden flex shadow-inner">
        {defaultValue > 0 && (
          <div 
            className={`${color} flex items-center justify-center text-white text-sm font-medium capacity-bar`}
            style={{ width: `${defaultPct}%` }}
          >
            {defaultPct > 15 && formatCapacity(defaultValue)}
          </div>
        )}
        {accrualValue > 0 && (
          <div 
            className="bg-gray-500 flex items-center justify-center text-white text-sm font-medium capacity-bar"
            style={{ width: `${accrualPct}%` }}
          >
            {accrualPct > 15 && `+${formatCapacity(accrualValue)}`}
          </div>
        )}
        {perAppAccrualValue > 0 && (
          <div 
            className="bg-amber-600 flex items-center justify-center text-white text-sm font-medium capacity-bar"
            style={{ width: `${perAppAccrualPct}%` }}
          >
            {perAppAccrualPct > 15 && `+${formatCapacity(perAppAccrualValue)}`}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="flex gap-6 mt-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${color}`}></div>
          <span>Default: {formatCapacity(defaultValue)}</span>
        </div>
        {accrualValue > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span>Per-user: {formatCapacity(accrualValue)}</span>
          </div>
        )}
        {perAppAccrualValue > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-600"></div>
            <span>Per-app: {formatCapacity(perAppAccrualValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-semibold text-gray-700 flex items-center gap-2">
          <span>ℹ️</span>
          How Capacity Licensing Works
        </span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-4 py-4 space-y-4 text-sm text-gray-600 fade-in">
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Default Capacity (Tenant-level)</h4>
            <p>When you license any Dataverse product, your tenant receives a one-time default capacity allocation. The highest tier product you license determines this amount. For example, if you have both D365 Sales Enterprise and D365 Finance, you get the ERP Standard defaults (90 GB DB, 80 GB File) instead of CRM defaults.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Per-User Accrual</h4>
            <p>In addition to default capacity, many products add capacity for each licensed user. This per-user capacity stacks across all products. So 100 Sales Enterprise users add 25 GB of database capacity (0.25 GB × 100).</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Highest Tier Wins</h4>
            <p>Only the highest tier's default capacity is granted - they don't stack. The tiers from highest to lowest are: ERP Premium → ERP Standard → CRM → Power Platform Premium → Power Platform Workload.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Products Without Accrual</h4>
            <p>Some products (like Sales Professional or Power Apps per app) don't add per-user capacity but still trigger the default capacity grant if they're the highest tier licensed.</p>
          </div>
        </div>
      )}
    </div>
  );
};

const Header = () => (
  <header className="bg-gradient-to-r from-purple-700 via-blue-600 to-teal-500 text-white py-4 px-4 shadow-lg no-print">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Dataverse Capacity Calculator</h1>
          <p className="text-sm text-white/80">Microsoft Power Platform & Dynamics 365</p>
        </div>
      </div>
      <div className="text-sm bg-white/10 px-3 py-1 rounded-full">
        December 2025 Values
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-800 text-gray-300 py-6 px-4 mt-auto no-print">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-center md:text-left">
          <p className="text-gray-400">Disclaimer: This calculator provides estimates based on publicly available licensing information.</p>
          <p className="text-gray-500 mt-1">Verify actual entitlements in the Power Platform Admin Center.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <a 
            href="https://learn.microsoft.com/en-us/power-platform/admin/capacity-storage" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>📚</span> Capacity Documentation
          </a>
          <a 
            href="https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/get-started/storage-management"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>💾</span> Storage Management
          </a>
          <a 
            href="https://admin.powerplatform.microsoft.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <span>⚙️</span> Admin Center
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default function App() {
  const [licenses, setLicenses] = useState({});
  
  const handleLicenseChange = (productId, value) => {
    setLicenses(prev => ({ ...prev, [productId]: value }));
  };
  
  const calculation = useMemo(() => {
    let highestTier = null;
    let dbAccrual = 0;
    let fileAccrual = 0;
    let dbPerAppAccrual = 0;
    let filePerAppAccrual = 0;
    
    for (const tier of PRODUCT_TIERS) {
      for (const product of tier.products) {
        const count = licenses[product.id] || 0;
        if (count > 0) {
          if (!highestTier || tier.priority < highestTier.priority) {
            highestTier = tier;
          }
          // Handle per-user accrual
          if (product.dbPerUser !== undefined) {
            dbAccrual += product.dbPerUser * count;
          }
          if (product.filePerUser !== undefined) {
            fileAccrual += product.filePerUser * count;
          }
          // Handle per-app accrual
          if (product.dbPerApp !== undefined) {
            dbPerAppAccrual += product.dbPerApp * count;
          }
          if (product.filePerApp !== undefined) {
            filePerAppAccrual += product.filePerApp * count;
          }
        }
      }
    }
    
    const dbDefault = highestTier?.dbDefault || 0;
    const fileDefault = highestTier?.fileDefault || 0;
    
    return {
      highestTier,
      dbDefault,
      fileDefault,
      dbAccrual,
      fileAccrual,
      dbPerAppAccrual,
      filePerAppAccrual,
      dbTotal: dbDefault + dbAccrual + dbPerAppAccrual,
      fileTotal: fileDefault + fileAccrual + filePerAppAccrual,
    };
  }, [licenses]);
  
  const maxDb = Math.max(150, calculation.dbTotal * 1.1);
  const maxFile = Math.max(150, calculation.fileTotal * 1.1);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Product Selection */}
        <div className="w-full lg:w-96 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 p-4 lg:p-6 lg:overflow-y-auto lg:h-[calc(100vh-8rem)] no-print">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Select Products</h2>
          <p className="text-sm text-gray-500 mb-4">Choose your licensed products and enter user counts</p>
          
          <div className="space-y-4">
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
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setLicenses({})}
              className="w-full py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              🔄 Reset all selections
            </button>
          </div>
          
          <HowItWorks />
        </div>
        
        {/* Right Panel - Capacity Metrics */}
        <div className="flex-1 p-4 lg:p-8 lg:overflow-y-auto lg:h-[calc(100vh-8rem)]">
          <div className="max-w-2xl mx-auto">
            {calculation.highestTier ? (
              <>
                <div className="mb-8 fade-in">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${tierColors[calculation.highestTier.id].light} ${tierColors[calculation.highestTier.id].text} text-sm font-medium shadow-sm`}>
                    <span className="text-lg">★</span>
                    <span>{calculation.highestTier.name}</span>
                    <span className="text-gray-500">determines default capacity</span>
                  </div>
                </div>
                
                <CapacityGauge
                  label="Database Capacity"
                  defaultValue={calculation.dbDefault}
                  accrualValue={calculation.dbAccrual}
                  perAppAccrualValue={calculation.dbPerAppAccrual}
                  total={calculation.dbTotal}
                  maxValue={maxDb}
                  color={tierColors[calculation.highestTier.id].bg}
                  icon="🗄️"
                />
                
                <CapacityGauge
                  label="File Capacity"
                  defaultValue={calculation.fileDefault}
                  accrualValue={calculation.fileAccrual}
                  perAppAccrualValue={calculation.filePerAppAccrual}
                  total={calculation.fileTotal}
                  maxValue={maxFile}
                  color={tierColors[calculation.highestTier.id].bg}
                  icon="📁"
                />
                
                {/* Breakdown table */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm fade-in">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">📊 Capacity Breakdown</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Source</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">Database</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-600">File</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-700 font-medium">Default ({calculation.highestTier.name})</td>
                          <td className="py-3 px-4 text-right text-gray-900">{calculation.dbDefault} GB</td>
                          <td className="py-3 px-4 text-right text-gray-900">{calculation.fileDefault} GB</td>
                        </tr>
                        {Object.entries(licenses).filter(([, v]) => v > 0).map(([productId, count]) => {
                          const product = PRODUCT_TIERS.flatMap(t => t.products).find(p => p.id === productId);
                          if (!product || product.noAccrual) return null;
                          
                          // Calculate capacity based on whether it's per-user or per-app
                          const db = (product.dbPerUser !== undefined ? product.dbPerUser : product.dbPerApp || 0) * count;
                          const file = (product.filePerUser !== undefined ? product.filePerUser : product.filePerApp || 0) * count;
                          
                          if (db === 0 && file === 0) return null;
                          return (
                            <tr key={productId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-gray-600">{product.name} × {count}</td>
                              <td className="py-3 px-4 text-right text-gray-700">+{db.toFixed(1)} GB</td>
                              <td className="py-3 px-4 text-right text-gray-700">+{file.toFixed(1)} GB</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 font-semibold">
                          <td className="py-3 px-4 text-gray-900">Total Capacity</td>
                          <td className="py-3 px-4 text-right text-gray-900">{formatCapacity(calculation.dbTotal)}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{formatCapacity(calculation.fileTotal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400 fade-in">
                <div className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg">Select products to calculate capacity</p>
                  <p className="text-sm mt-2">Choose from the product tiers on the left</p>
                </div>
              </div>
            )}
            
            {/* Notes */}
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <strong className="flex items-center gap-2 mb-2">
                <span>⚠️</span> Important Notes
              </strong>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Default capacity is granted once per tenant — highest tier wins</li>
                <li>Per-user accrual stacks across all licensed products</li>
                <li>Log capacity (2-3 GB) is not shown in this calculator</li>
                <li>Always verify actual entitlements in Power Platform Admin Center</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
