import React, { useState, useMemo } from 'react';

// Product definitions with capacity values (December 2025)
const PRODUCT_TIERS = [
  {
    id: 'erp-premium',
    name: 'D365 ERP Premium',
    dbDefault: 125,
    fileDefault: 110,
    priority: 1,
    products: [
      { id: 'finance-premium', name: 'Finance Premium', dbPerUser: 10, filePerUser: 10 },
      { id: 'scm-premium', name: 'SCM Premium', dbPerUser: 10, filePerUser: 10 },
    ]
  },
  {
    id: 'erp-standard',
    name: 'D365 ERP Standard',
    dbDefault: 90,
    fileDefault: 80,
    priority: 2,
    products: [
      { id: 'commerce', name: 'Commerce', dbPerUser: 5, filePerUser: 5 },
      { id: 'finance', name: 'Finance', dbPerUser: 5, filePerUser: 5 },
      { id: 'project-ops', name: 'Project Operations', dbPerUser: 5, filePerUser: 5 },
      { id: 'scm', name: 'Supply Chain Mgmt', dbPerUser: 5, filePerUser: 5 },
      { id: 'hr', name: 'Human Resources', dbPerUser: 1, filePerUser: 2 },
    ]
  },
  {
    id: 'crm',
    name: 'D365 CRM',
    dbDefault: 30,
    fileDefault: 40,
    priority: 3,
    products: [
      { id: 'sales-ent', name: 'Sales Enterprise', dbPerUser: 0.25, filePerUser: 2 },
      { id: 'sales-premium', name: 'Sales Premium', dbPerUser: 0.25, filePerUser: 2 },
      { id: 'cs-ent', name: 'Customer Service Enterprise', dbPerUser: 0.25, filePerUser: 2 },
      { id: 'cs-premium', name: 'Customer Service Premium', dbPerUser: 0.25, filePerUser: 35 },
      { id: 'field-service', name: 'Field Service', dbPerUser: 0.25, filePerUser: 2 },
      { id: 'contact-center', name: 'Contact Center Voice', dbPerUser: 0.25, filePerUser: 35 },
      { id: 'sales-pro', name: 'Sales Professional', dbPerUser: 0, filePerUser: 0, noAccrual: true },
      { id: 'cs-pro', name: 'CS Professional', dbPerUser: 0, filePerUser: 0, noAccrual: true },
    ]
  },
  {
    id: 'pp-premium',
    name: 'Power Platform Premium',
    dbDefault: 20,
    fileDefault: 40,
    priority: 4,
    products: [
      { id: 'pa-premium', name: 'Power Apps Premium', dbPerUser: 0.25, filePerUser: 2 },
      { id: 'pautom-premium', name: 'Power Automate Premium', dbPerUser: 0.25, filePerUser: 2 },
    ]
  },
  {
    id: 'pp-workload',
    name: 'Power Platform Workload',
    dbDefault: 15,
    fileDefault: 20,
    priority: 5,
    products: [
      { id: 'pa-perapp', name: 'Power Apps per app', dbPerUser: 0, filePerUser: 0, noAccrual: true },
      { id: 'pautom-process', name: 'Power Automate Process', dbPerUser: 0, filePerUser: 0, noAccrual: true },
      { id: 'copilot-studio', name: 'Copilot Studio', dbPerUser: 0, filePerUser: 0, noAccrual: true },
    ]
  },
];

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

const ProductRow = ({ product, value, onChange }) => {
  const hasAccrual = !product.noAccrual && (product.dbPerUser > 0 || product.filePerUser > 0);
  const isActive = value > 0;
  
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
          {product.name}
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
            <span className="text-xs text-gray-400">users</span>
          </div>
        )}
        {isActive && product.noAccrual && (
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
          {tier.dbDefault}GB / {tier.fileDefault}GB
        </span>
      </div>
      <div className="px-3 py-2 space-y-1">
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

const CapacityGauge = ({ label, defaultValue, accrualValue, total, maxValue, color }) => {
  const defaultPct = (defaultValue / maxValue) * 100;
  const accrualPct = (accrualValue / maxValue) * 100;
  
  return (
    <div className="mb-6">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-lg font-semibold text-gray-800">{label}</span>
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
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 rounded ${color}`}></div>
          <span>Default: {formatCapacity(defaultValue)}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span>Per-user: {formatCapacity(accrualValue)}</span>
        </div>
      </div>
    </div>
  );
};

export default function DataverseCapacityCalculator() {
  const [licenses, setLicenses] = useState({});
  
  const handleLicenseChange = (productId, value) => {
    setLicenses(prev => ({ ...prev, [productId]: value }));
  };
  
  const calculation = useMemo(() => {
    let highestTier = null;
    let dbAccrual = 0;
    let fileAccrual = 0;
    
    for (const tier of PRODUCT_TIERS) {
      for (const product of tier.products) {
        const count = licenses[product.id] || 0;
        if (count > 0) {
          if (!highestTier || tier.priority < highestTier.priority) {
            highestTier = tier;
          }
          dbAccrual += product.dbPerUser * count;
          fileAccrual += product.filePerUser * count;
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
      dbTotal: dbDefault + dbAccrual,
      fileTotal: fileDefault + fileAccrual,
    };
  }, [licenses]);
  
  const maxDb = Math.max(150, calculation.dbTotal * 1.1);
  const maxFile = Math.max(150, calculation.fileTotal * 1.1);
  
  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Left Panel - Product Selection */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4 flex-shrink-0">
        <h1 className="text-lg font-bold text-gray-900 mb-1">Dataverse Capacity</h1>
        <p className="text-xs text-gray-500 mb-4">December 2025 values</p>
        
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
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setLicenses({})}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition"
          >
            Reset all
          </button>
        </div>
      </div>
      
      {/* Right Panel - Capacity Metrics */}
      <div className="flex-1 p-8 overflow-y-auto">
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
                total={calculation.dbTotal}
                maxValue={maxDb}
                color={tierColors[calculation.highestTier.id].bg}
              />
              
              <CapacityGauge
                label="File Capacity"
                defaultValue={calculation.fileDefault}
                accrualValue={calculation.fileAccrual}
                total={calculation.fileTotal}
                maxValue={maxFile}
                color={tierColors[calculation.highestTier.id].bg}
              />
              
              {/* Breakdown table */}
              <div className="mt-8 bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <span className="font-semibold text-gray-700 text-sm">Capacity Breakdown</span>
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
                      <td className="py-2 px-4 text-gray-700">Default ({calculation.highestTier.name})</td>
                      <td className="py-2 px-4 text-right text-gray-900">{calculation.dbDefault} GB</td>
                      <td className="py-2 px-4 text-right text-gray-900">{calculation.fileDefault} GB</td>
                    </tr>
                    {Object.entries(licenses).filter(([_, v]) => v > 0).map(([productId, count]) => {
                      const product = PRODUCT_TIERS.flatMap(t => t.products).find(p => p.id === productId);
                      if (!product || product.noAccrual) return null;
                      const db = product.dbPerUser * count;
                      const file = product.filePerUser * count;
                      if (db === 0 && file === 0) return null;
                      return (
                        <tr key={productId} className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-600">{product.name} × {count}</td>
                          <td className="py-2 px-4 text-right text-gray-700">+{db.toFixed(1)} GB</td>
                          <td className="py-2 px-4 text-right text-gray-700">+{file.toFixed(0)} GB</td>
                        </tr>
                      );
                    })}
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
            Verify actual entitlements in Power Platform Admin Center.
          </div>
        </div>
      </div>
    </div>
  );
}
