import React, { useState } from 'react';
import { 
  Package, 
  Laptop, 
  Truck, 
  Armchair, 
  Cpu, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  UserCheck, 
  ArrowLeftRight,
  Boxes,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardList
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { 
  OfficeAsset, 
  ConsumableItem, 
  AssetCategory, 
  CurrentUser, 
  Employee,
  InventoryTransaction
} from '../../types/office';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';

interface AssetsViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  currentUser: CurrentUser;
  employees: Employee[];
  assets: OfficeAsset[];
  consumables: ConsumableItem[];
  inventoryTransactions?: InventoryTransaction[];
  onAddAsset: (asset: Omit<OfficeAsset, 'id'>) => void;
  onUpdateAssetStatus: (assetId: string, status: any, assignedToId?: string, assignedToName?: string) => void;
  onAdjustConsumable: (itemId: string, qtyDelta: number) => void;
  onAddConsumable: (item: Omit<ConsumableItem, 'id'>) => void;
  onAddInventoryTransaction?: (tx: Omit<InventoryTransaction, 'id'>) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  lang,
  currency,
  currentUser,
  employees,
  assets,
  consumables,
  inventoryTransactions = [],
  onAddAsset,
  onUpdateAssetStatus,
  onAdjustConsumable,
  onAddConsumable,
  onAddInventoryTransaction
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'fixed' | 'consumables' | 'transactions'>('fixed');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Asset Modals
  const [isNewAssetModalOpen, setIsNewAssetModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedAssetForHandover, setSelectedAssetForHandover] = useState<OfficeAsset | null>(null);
  const [handoverEmployeeId, setHandoverEmployeeId] = useState('');

  // Stock In / Stock Out Modals (Inventory Management)
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);

  // Stock In Form
  const [stockInItemId, setStockInItemId] = useState(consumables[0]?.id || '');
  const [stockInQty, setStockInQty] = useState('25');
  const [stockInSupplier, setStockInSupplier] = useState('');
  const [stockInUnitCost, setStockInUnitCost] = useState('25000');
  const [stockInRefNo, setStockInRefNo] = useState(`GRN-${Date.now().toString().slice(-4)}`);

  // Stock Out Form
  const [stockOutItemId, setStockOutItemId] = useState(consumables[0]?.id || '');
  const [stockOutQty, setStockOutQty] = useState('5');
  const [stockOutEmployeeId, setStockOutEmployeeId] = useState(employees[0]?.id || '');
  const [stockOutDepartment, setStockOutDepartment] = useState('Utawala & Uongozi');
  const [stockOutReason, setStockOutReason] = useState('Matumizi ya kawaida ya ofisi');
  const [stockOutRefNo, setStockOutRefNo] = useState(`REQ-${Date.now().toString().slice(-4)}`);

  // New Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('it_hardware');
  const [assetModel, setAssetModel] = useState('');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetCost, setAssetCost] = useState('');
  const [assetCondition, setAssetCondition] = useState<'excellent' | 'good' | 'needs_repair'>('excellent');
  const [assetLocation, setAssetLocation] = useState('Ghorofa ya 7 - Ofisi Kuu');
  const [assetNotes, setAssetNotes] = useState('');

  // Consumable Adjustment Modal
  const [isNewConsumableModalOpen, setIsNewConsumableModalOpen] = useState(false);
  const [consumableName, setConsumableName] = useState('');
  const [consumableUnit, setConsumableUnit] = useState('Rimu (Reams)');
  const [consumableQty, setConsumableQty] = useState(10);
  const [consumableThreshold, setConsumableThreshold] = useState(5);
  const [consumableCost, setConsumableCost] = useState(25000);
  const [consumableSupplier, setConsumableSupplier] = useState('');

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const assignedAssetsCount = assets.filter(a => a.status === 'assigned').length;
  const maintenanceCount = assets.filter(a => a.status === 'under_maintenance' || a.condition === 'needs_repair').length;

  const filteredAssets = assets.filter(a => {
    const matchesCat = categoryFilter === 'all' || a.category === categoryFilter;
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.assetTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.assignedToName && a.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleRegisterAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName) return;

    const tag = `KD-AST-0${100 + assets.length + 1}`;
    onAddAsset({
      assetTag: tag,
      name: assetName,
      category: assetCategory,
      model: assetModel || assetName,
      serialNumber: assetSerial || `SN-${Date.now().toString().slice(-6)}`,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseCost: assetCost ? parseFloat(assetCost) : 1000000,
      condition: assetCondition,
      status: 'in_store',
      location: assetLocation,
      notes: assetNotes,
    });

    setIsNewAssetModalOpen(false);
    setAssetName('');
    setAssetModel('');
    setAssetSerial('');
    setAssetCost('');
    setAssetNotes('');
  };

  const handleHandoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForHandover) return;

    if (!handoverEmployeeId || handoverEmployeeId === 'return_to_store') {
      onUpdateAssetStatus(selectedAssetForHandover.id, 'in_store', undefined, undefined);
    } else {
      const emp = employees.find(e => e.id === handoverEmployeeId);
      if (emp) {
        onUpdateAssetStatus(selectedAssetForHandover.id, 'assigned', emp.id, emp.fullName);
      }
    }

    setIsHandoverModalOpen(false);
    setSelectedAssetForHandover(null);
  };

  const handleExportAssetsCSV = () => {
    const headers = ['Namba ya Mali', 'Jina la Kifaa', 'Kitengo', 'Model/Serial', 'Thamani', 'Hali', 'Hali ya Matumizi', 'Aliyekabidhiwa', 'Mahali'];
    const rows = filteredAssets.map(a => [
      a.assetTag,
      a.name,
      a.category,
      `${a.model} (${a.serialNumber})`,
      a.purchaseCost,
      a.condition,
      a.status,
      a.assignedToName || 'Stoo Kuu',
      a.location
    ]);
    exportToCSV('Daftari_la_Rasilimali_za_Ofisi', headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.assets.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.assets.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportAssetsCSV}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Pakua Orodha (CSV)</span>
          </button>

          {activeTab === 'fixed' && (
            <button
              onClick={() => setIsNewAssetModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.assets.registerAsset}</span>
            </button>
          )}

          {activeTab === 'consumables' && (
            <button
              onClick={() => setIsNewConsumableModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ongeza Kifaa Kipya Stoo</span>
            </button>
          )}

          {activeTab === 'transactions' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsStockInModalOpen(true)}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Pokea Mzigo Stoo (Stock In)</span>
              </button>
              <button
                onClick={() => setIsStockOutModalOpen(true)}
                className="px-3 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Toa Mzigo kwa Idara (Stock Out)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Thamani ya Rasilimali</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatCurrency(totalAssetValue, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{assets.length} Vifaa vilivyosajiliwa</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Vifaa Vilivyokabidhiwa</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {assignedAssetsCount} Vifaa
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vinatumiwa na wafanyakazi</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Vifaa Stoo Kuu</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {assets.length - assignedAssetsCount - maintenanceCount} Vifaa
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vipo tayari kukabidhiwa</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Matengenezo & Ukarabati</div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
            {maintenanceCount} Vifaa
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Vinahitaji mafundi</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('fixed')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'fixed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t.assets.fixedAssetsTab}</span>
          {activeTab === 'fixed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('consumables')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'consumables' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>{t.assets.consumablesTab}</span>
          {consumables.some(c => c.quantityInStock <= c.minThreshold) && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
              Tahadhari
            </span>
          )}
          {activeTab === 'consumables' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'transactions' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Mienendo ya Stoo & Kumbukumbu (Stock In/Out Logs)</span>
          {activeTab === 'transactions' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
        </button>
      </div>

      {/* Tab 1: Fixed Assets */}
      {activeTab === 'fixed' && (
        <div className="space-y-4">
          
          {/* Search & Filter */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tafuta kifaa kwa tag, jina au aliyekabidhiwa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">Vitengo Vyote vya Mali</option>
              <option value="it_hardware">Vifaa vya Tehama (IT Hardware)</option>
              <option value="vehicle">Magari ya Ofisi (Vehicles)</option>
              <option value="office_furniture">Samani za Ofisi (Furniture)</option>
              <option value="appliances">Printa & Mashine (Appliances)</option>
              <option value="network_equipment">Mifumo ya Mtandao</option>
            </select>
          </div>

          {/* Assets Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Tag ya Mali</th>
                    <th className="py-3 px-4">Jina la Kifaa & Model</th>
                    <th className="py-3 px-4">Kitengo</th>
                    <th className="py-3 px-4">Thamani</th>
                    <th className="py-3 px-4">Hali</th>
                    <th className="py-3 px-4">Hali ya Matumizi</th>
                    <th className="py-3 px-4">Aliyekabidhiwa</th>
                    <th className="py-3 px-4">Mahali</th>
                    <th className="py-3 px-4 text-right">Kitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {asset.assetTag}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{asset.model} · {asset.serialNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 capitalize">
                        {asset.category === 'it_hardware' ? 'Kompyuta/IT' :
                         asset.category === 'vehicle' ? 'Gari la Kazi' :
                         asset.category === 'appliances' ? 'Mashine/Printa' :
                         asset.category === 'office_furniture' ? 'Samani' : 'Mtandao'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums">
                        {formatCurrency(asset.purchaseCost, currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold ${
                          asset.condition === 'excellent' ? 'text-emerald-600' :
                          asset.condition === 'good' ? 'text-blue-600' :
                          asset.condition === 'needs_repair' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {asset.condition === 'excellent' ? 'Nzuri Sana' :
                           asset.condition === 'good' ? 'Inafaa' :
                           asset.condition === 'needs_repair' ? 'Inahitaji Ukarabati' : 'Imeharibika'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          asset.status === 'assigned' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950' :
                          asset.status === 'under_maintenance' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                          {asset.status === 'assigned' ? 'Inatumika' :
                           asset.status === 'under_maintenance' ? 'Ukarabati' : 'Stoo Kuu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {asset.assignedToName || <span className="text-slate-400 font-normal">Stoo Kuu</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{asset.location}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedAssetForHandover(asset);
                            setHandoverEmployeeId(asset.assignedToId || '');
                            setIsHandoverModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded flex items-center gap-1 ml-auto"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Kabidhi</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Consumables & Stock */}
      {activeTab === 'consumables' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Stoo ya Vifaa vya Matumizi ya Kila Siku (Office Consumables)
                </h3>
                <p className="text-xs text-slate-500">
                  Dhibiti idadi ya karatasi, toners za printa, kahawa, chai na vifaa vya usafi kwa wakati halisi.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Msimbo (Code)</th>
                    <th className="py-3 px-4">Kifaa cha Stoo</th>
                    <th className="py-3 px-4">Kitengo</th>
                    <th className="py-3 px-4">Kiasi Kilichopo</th>
                    <th className="py-3 px-4">Kiwango cha Chini</th>
                    <th className="py-3 px-4">Bei kwa Kizio</th>
                    <th className="py-3 px-4">Hali ya Stoo</th>
                    <th className="py-3 px-4 text-right">Rekebisha Idadi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {consumables.map(item => {
                    const isLow = item.quantityInStock <= item.minThreshold;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.itemCode}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400">Muuzaji: {item.supplier}</div>
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-500">
                          {item.category === 'stationery' ? 'Stationery' :
                           item.category === 'pantry' ? 'Jiko / Vinywaji' : 'Usafi'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-base tabular-nums">
                          <span className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>
                            {item.quantityInStock} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 tabular-nums">
                          {item.minThreshold} {item.unit}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums">
                          {formatCurrency(item.unitCost, currency)}
                        </td>
                        <td className="py-3 px-4">
                          {isLow ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Stoo Imeishiwa!</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Salama</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onAdjustConsumable(item.id, -1)}
                              disabled={item.quantityInStock <= 0}
                              className="w-7 h-7 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40"
                              title="Punguza 1 (Matumizi ya Ofisi)"
                            >
                              -
                            </button>
                            <button
                              onClick={() => onAdjustConsumable(item.id, 5)}
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="Ongeza 5 (Kupokea Mzigo)"
                            >
                              +5 Mzigo
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory Transactions & Stock Movement */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Jumla ya Mienendo</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {inventoryTransactions.length} Rekodi
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mizigo Iliyoingia (IN)</div>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                  {inventoryTransactions.filter(t => t.type === 'IN').length} Mizigo
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mizigo Iliyotoka (OUT)</div>
                <div className="text-xl font-bold font-mono text-blue-600 mt-1">
                  {inventoryTransactions.filter(t => t.type === 'OUT').length} Maombi
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Kumbukumbu Kamili za Stoo & Mienendo ya Vifaa (Inventory Movement Log)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsStockInModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1 shadow-xs"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Pokea Mzigo (GRN)</span>
                </button>
                <button
                  onClick={() => setIsStockOutModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center gap-1 shadow-xs"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Toa Mzigo (Requisition)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Tarehe & Saa</th>
                    <th className="py-3 px-4">Aina ya Muamala</th>
                    <th className="py-3 px-4 font-mono">Hati ya Rejea</th>
                    <th className="py-3 px-4">Kifaa / Bidhaa</th>
                    <th className="py-3 px-4 font-mono">Idadi (Quantity)</th>
                    <th className="py-3 px-4">Idara / Mpokeaji au Msambazaji</th>
                    <th className="py-3 px-4">Afisa Aliyehusika</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {inventoryTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          tx.type === 'IN' 
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        }`}>
                          {tx.type === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{tx.type === 'IN' ? 'Kuingia Stoo (IN)' : 'Kutoka Stoo (OUT)'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {tx.referenceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {tx.itemName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={tx.type === 'IN' ? 'text-emerald-600' : 'text-blue-600'}>
                          {tx.type === 'IN' ? `+${tx.quantity}` : `-${tx.quantity}`} {tx.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tx.type === 'IN' ? (
                          <div className="text-[11px]">
                            <span className="text-slate-400">Msambazaji:</span> <span className="font-medium text-slate-700 dark:text-slate-300">{tx.supplier || 'Mtoa Huduma'}</span>
                          </div>
                        ) : (
                          <div className="text-[11px]">
                            <div className="font-medium text-slate-700 dark:text-slate-300">{tx.recipientEmployeeName}</div>
                            <div className="text-[10px] text-slate-400">{tx.department} · {tx.purpose}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {tx.issuedBy}
                      </td>
                    </tr>
                  ))}
                  {inventoryTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Hakuna mienendo ya stoo iliyorekodiwa kwa sasa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Asset Handover Modal */}
      {isHandoverModalOpen && selectedAssetForHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Kukabidhi Mali ya Ofisi
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Kifaa: <strong>{selectedAssetForHandover.name}</strong> ({selectedAssetForHandover.assetTag})
            </p>

            <form onSubmit={handleHandoverSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Chagua Mfanyakazi / Hali:
                </label>
                <select
                  value={handoverEmployeeId}
                  onChange={e => setHandoverEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="return_to_store">-- Rudisha Stoo Kuu (Available in Store) --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.roleTitle} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Hifadhi Ukabidhishaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Asset Modal */}
      {isNewAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Sajili Kifaa au Mali Mpya ya Ofisi
            </h3>

            <form onSubmit={handleRegisterAsset} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Jina la Kifaa:</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: HP LaserJet Pro M404dn au Dell Monitor 27..."
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Kitengo:</label>
                  <select
                    value={assetCategory}
                    onChange={e => setAssetCategory(e.target.value as AssetCategory)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="it_hardware">Vifaa vya Tehama (IT)</option>
                    <option value="vehicle">Gari la Kazi</option>
                    <option value="office_furniture">Samani za Ofisi</option>
                    <option value="appliances">Printa / Mashine</option>
                    <option value="network_equipment">Mtandao & Seva</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Gharama ya Ununuzi ({currency}):</label>
                  <input
                    type="number"
                    placeholder="Gharama ya kifaa"
                    value={assetCost}
                    onChange={e => setAssetCost(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Model & Vipimo:</label>
                  <input
                    type="text"
                    placeholder="Mfano: Core i7, 16GB RAM"
                    value={assetModel}
                    onChange={e => setAssetModel(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Serial Number:</label>
                  <input
                    type="text"
                    placeholder="Namba ya utambulisho wa kifaa"
                    value={assetSerial}
                    onChange={e => setAssetSerial(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Mahali Kilipo Ofisini:</label>
                <input
                  type="text"
                  value={assetLocation}
                  onChange={e => setAssetLocation(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewAssetModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Sajili Kifaa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Consumable Modal */}
      {isNewConsumableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Ongeza Kifaa Kipya cha Stoo
            </h3>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!consumableName) return;
                onAddConsumable({
                  itemCode: `STN-${Date.now().toString().slice(-4)}`,
                  name: consumableName,
                  category: 'stationery',
                  unit: consumableUnit,
                  quantityInStock: Number(consumableQty),
                  minThreshold: Number(consumableThreshold),
                  unitCost: Number(consumableCost),
                  lastRestocked: new Date().toISOString().split('T')[0],
                  supplier: consumableSupplier || 'Dar Stationery Supermarket',
                });
                setIsNewConsumableModalOpen(false);
                setConsumableName('');
              }} 
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Jina la Kifaa:</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Vitabu vya Kumbukumbu (Hardcover NoteBooks)..."
                  value={consumableName}
                  onChange={e => setConsumableName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Kipimo (Unit):</label>
                  <input
                    type="text"
                    value={consumableUnit}
                    onChange={e => setConsumableUnit(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Idadi ya Kuanzia:</label>
                  <input
                    type="number"
                    value={consumableQty}
                    onChange={e => setConsumableQty(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Kiwango cha Tahadhari:</label>
                  <input
                    type="number"
                    value={consumableThreshold}
                    onChange={e => setConsumableThreshold(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Gharama kwa Kizio ({currency}):</label>
                  <input
                    type="number"
                    value={consumableCost}
                    onChange={e => setConsumableCost(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewConsumableModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Hifadhi Kifaa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK IN (GRN - Kupokea Mzigo Stoo) */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
              <span>Pokea Mzigo Mpya Stoo (Stock In / GRN)</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedItem = consumables.find(c => c.id === stockInItemId) || consumables[0];
                if (!selectedItem) return;
                const qty = parseInt(stockInQty, 10) || 0;
                if (qty <= 0) return;
                const cost = parseFloat(stockInUnitCost) || selectedItem.unitCost;

                onAddInventoryTransaction?.({
                  date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  type: 'IN',
                  itemId: selectedItem.id,
                  itemName: selectedItem.name,
                  category: selectedItem.category,
                  quantity: qty,
                  unit: selectedItem.unit,
                  unitCost: cost,
                  totalCost: cost * qty,
                  supplier: stockInSupplier || selectedItem.supplier || 'Dar Stationery Supermarket',
                  referenceNumber: stockInRefNo || `GRN-${Date.now().toString().slice(-4)}`,
                  issuedBy: currentUser?.name || 'Mkuu wa Stoo',
                  notes: 'Kupokelewa stoo ya ofisi na kusasishwa kwenye mfumo.',
                });

                onAdjustConsumable(selectedItem.id, qty);
                setIsStockInModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Chagua Kifaa / Bidhaa: *
                </label>
                <select
                  value={stockInItemId}
                  onChange={e => setStockInItemId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {consumables.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.quantityInStock} {c.unit} zilizopo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Idadi Iliyopokelewa: *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockInQty}
                    onChange={e => setStockInQty(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Gharama kwa Kizio ({currency}):
                  </label>
                  <input
                    type="number"
                    value={stockInUnitCost}
                    onChange={e => setStockInUnitCost(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Jina la Msambazaji (Supplier):
                  </label>
                  <input
                    type="text"
                    placeholder="Mfano: Office Solutions Ltd"
                    value={stockInSupplier}
                    onChange={e => setStockInSupplier(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Namba ya Hati (GRN Ref):
                  </label>
                  <input
                    type="text"
                    value={stockInRefNo}
                    onChange={e => setStockInRefNo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Thibitisha Kupokea Mzigo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK OUT (Requisition - Kutoa Mzigo kwa Idara) */}
      {isStockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-blue-600" />
              <span>Toa Vifaa kwa Idara (Stock Out / Requisition)</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const selectedItem = consumables.find(c => c.id === stockOutItemId) || consumables[0];
                if (!selectedItem) return;
                const qty = parseInt(stockOutQty, 10) || 0;
                if (qty <= 0) return;
                if (qty > selectedItem.quantityInStock) {
                  alert(`Idadi uliyoomba (${qty}) inazidi kiasi kilichopo stoo (${selectedItem.quantityInStock})`);
                  return;
                }

                const emp = employees.find(e => e.id === stockOutEmployeeId);

                onAddInventoryTransaction?.({
                  date: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  type: 'OUT',
                  itemId: selectedItem.id,
                  itemName: selectedItem.name,
                  category: selectedItem.category,
                  quantity: qty,
                  unit: selectedItem.unit,
                  unitCost: selectedItem.unitCost,
                  totalCost: selectedItem.unitCost * qty,
                  department: stockOutDepartment,
                  recipientEmployeeId: emp?.id,
                  recipientEmployeeName: emp?.fullName || 'Afisa wa Ofisi',
                  purpose: stockOutReason || 'Matumizi ya Kazi',
                  referenceNumber: stockOutRefNo || `REQ-${Date.now().toString().slice(-4)}`,
                  issuedBy: currentUser?.name || 'Mkuu wa Stoo',
                  notes: 'Vifaa vimetolewa kwa matumizi ya idara husika.',
                });

                onAdjustConsumable(selectedItem.id, -qty);
                setIsStockOutModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Chagua Kifaa / Bidhaa Inayotoka: *
                </label>
                <select
                  value={stockOutItemId}
                  onChange={e => setStockOutItemId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {consumables.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.quantityInStock} {c.unit} zipo stoo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Idadi Inayotolewa: *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={stockOutQty}
                    onChange={e => setStockOutQty(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Idara ya Mpokeaji: *
                  </label>
                  <select
                    value={stockOutDepartment}
                    onChange={e => setStockOutDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Utawala & Uongozi">Utawala & Uongozi</option>
                    <option value="Rasilimali Watu (HR)">Rasilimali Watu (HR)</option>
                    <option value="Fedha & Uhasibu">Fedha & Uhasibu</option>
                    <option value="Teknolojia (IT & Mifumo)">Teknolojia (IT & Mifumo)</option>
                    <option value="Uendeshaji & Usafirishaji">Uendeshaji & Usafirishaji</option>
                    <option value="Masoko & Mauzo">Masoko & Mauzo</option>
                    <option value="Sheria & Mikataba">Sheria & Mikataba</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Mfanyakazi Mpokeaji:
                  </label>
                  <select
                    value={stockOutEmployeeId}
                    onChange={e => setStockOutEmployeeId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.roleTitle})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    Namba ya Requisition:
                  </label>
                  <input
                    type="text"
                    value={stockOutRefNo}
                    onChange={e => setStockOutRefNo(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Sababu / Matumizi:
                </label>
                <input
                  type="text"
                  placeholder="Mfano: Matumizi ya semina ya idara..."
                  value={stockOutReason}
                  onChange={e => setStockOutReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockOutModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Thibitisha Kutoa Vifaa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
