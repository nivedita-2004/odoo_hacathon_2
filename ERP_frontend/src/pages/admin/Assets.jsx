import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Box, QrCode, HardDrive, Download, Upload, X, History, Tag, Building2, MapPin } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/apis';
import ListSkeleton from "../../components/layout/ListSkeleton";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Slide-over states
  const [showRegister, setShowRegister] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  // Form State
  const initialForm = {
    name: '', asset_tag: '', serial_number: '', category_id: '',
    status_id: '', condition_id: '', purchase_cost: '', purchase_date: '',
    current_department_id: '', current_employee_id: ''
  };
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchAssets = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ASSETS.BASE, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('assetflow_token')}` }
      });
      const data = await res.json();
      if(data.success) setAssets(data.data);
    } catch(err) { console.error(err); }
  };

  const fetchMetadata = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.ASSETS.METADATA, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('assetflow_token')}` }
      });
      const data = await res.json();
      if(data.success) setMetadata(data.data);
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    Promise.all([fetchAssets(), fetchMetadata()]).finally(() => setLoading(false));
  }, []);

  const handleExport = () => {
    window.location.href = `${API_ENDPOINTS.ASSETS.BASE}/export?token=${localStorage.getItem('assetflow_token')}`;
    // Wait, GET endpoints with authorization headers are tricky with window.location.href unless we pass token in query.
    // Let's do fetch and blob.
  };

  const handleExportDownload = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.ASSETS.BASE}/export`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('assetflow_token')}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assets.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch(err) { console.error('Export failed', err); }
  };

  const downloadTemplate = () => {
    const headers = "Asset Name,Tag,Serial Number,Category,Subcategory,Status,Condition,Cost,Purchase Date,Department,Employee\n";
    const sample = "MacBook Pro M2,AST-1001,C02XG,Electronics,General,Available,Good,1999.99,2026-07-12,Information Technology,";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_import_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await fetch(API_ENDPOINTS.ASSETS.IMPORT, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('assetflow_token')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setShowImport(false);
        setImportFile(null);
        fetchAssets();
        alert(data.message);
      } else {
        alert(data.error);
      }
    } catch(err) {
      console.error(err);
      alert('Import failed');
    }
    setImporting(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(API_ENDPOINTS.ASSETS.BASE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('assetflow_token')}` 
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setShowRegister(false);
        setForm(initialForm);
        fetchAssets();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const updateForm = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.asset_tag.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <ListSkeleton />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#4f3448]">Asset Directory</h1>
          <p className="text-gray-500 mt-1">Manage all organization assets, tags, and lifecycles.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={handleExportDownload} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 text-sm font-medium text-gray-700">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => setShowRegister(true)} className="flex items-center gap-2 bg-[#4f3448] text-white px-4 py-2 rounded-sm hover:bg-[#3f2939] transition-colors text-sm font-medium">
            <Plus size={16} /> Register Asset
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-sm border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by Name, Tag, or Serial Number..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:border-[#4f3448] text-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-sm hover:bg-gray-50 text-sm text-gray-600">
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#4f3448]/5 text-gray-700">
            <tr>
              <th className="px-6 py-4 font-semibold">Asset Details</th>
              <th className="px-6 py-4 font-semibold">Tag & Serial</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Assigned To</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssets.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">No assets found.</td></tr>
            ) : filteredAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedAsset(asset)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#4f3448]/10 text-[#4f3448] rounded-sm"><HardDrive size={18} /></div>
                    <div>
                      <p className="font-medium text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.condition}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-mono text-[#4f3448]">{asset.asset_tag}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{asset.serial_number || 'N/A'}</p>
                </td>
                <td className="px-6 py-4 text-gray-600">{asset.category_name}</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-xs rounded-full border bg-gray-50 text-gray-700">
                    {asset.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {asset.first_name ? (
                    <div className="flex flex-col">
                      <span className="text-gray-900">{asset.first_name} {asset.last_name}</span>
                      <span className="text-xs text-gray-500">{asset.department_name}</span>
                    </div>
                  ) : <span className="text-gray-400">Unassigned</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }} className="text-[#4f3448] hover:underline font-medium text-xs">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Import CSV Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[500px] rounded-sm shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#4f3448]/5">
              <div>
                <h2 className="text-xl font-bold text-[#4f3448]">Import Assets</h2>
                <p className="text-sm text-gray-500">Bulk upload via CSV file.</p>
              </div>
              <button onClick={() => setShowImport(false)} className="p-2 hover:bg-white rounded-full text-gray-500"><X size={20} /></button>
            </div>
            <form onSubmit={handleImport} className="p-6 space-y-6">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-sm text-sm border border-blue-100">
                <p className="font-semibold mb-1">Important:</p>
                <p>Your CSV must include the following EXACT headers: <br/><code className="bg-blue-100 px-1 py-0.5 rounded">Asset Name, Tag, Serial Number, Category, Subcategory, Status, Condition, Cost, Purchase Date, Department, Employee</code></p>
                <button type="button" onClick={downloadTemplate} className="mt-3 text-sm font-semibold underline text-blue-700 hover:text-blue-900">
                  Download Sample Template
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-sm hover:border-[#4f3448]/50 transition-colors bg-gray-50">
                <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                <label className="block text-sm font-medium text-[#4f3448] cursor-pointer hover:underline">
                  Choose a CSV file
                  <input type="file" required accept=".csv" className="hidden" onChange={(e) => setImportFile(e.target.files[0])} />
                </label>
                <p className="text-xs text-gray-500 mt-1">{importFile ? importFile.name : 'No file selected'}</p>
              </div>
              <button type="submit" disabled={!importFile || importing} className="w-full py-2.5 bg-[#4f3448] text-white rounded-sm font-medium hover:bg-[#3f2939] disabled:opacity-50 transition-colors">
                {importing ? 'Processing & Generating QR Codes...' : 'Upload & Import'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register Asset Slide-over */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
          <div className="w-[500px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#4f3448]/5">
              <div>
                <h2 className="text-xl font-bold text-[#4f3448]">Register New Asset</h2>
                <p className="text-sm text-gray-500">Add hardware, vehicles, or equipment.</p>
              </div>
              <button onClick={() => setShowRegister(false)} className="p-2 hover:bg-white rounded-full text-gray-500"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleRegister} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Basic Info</h3>
                
                <label className="block text-sm font-medium text-gray-700">Asset Name *
                  <input required name="name" value={form.name} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none" placeholder="MacBook Pro M2" />
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-gray-700">Asset Tag *
                    <input required name="asset_tag" value={form.asset_tag} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm font-mono focus:border-[#4f3448] outline-none" placeholder="AST-1001" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">Serial Number
                    <input name="serial_number" value={form.serial_number} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm font-mono focus:border-[#4f3448] outline-none" placeholder="C02XG..." />
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Classification</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-gray-700">Category *
                    <select required name="category_id" value={form.category_id} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none">
                      <option value="">Select Category</option>
                      {metadata.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">Status *
                    <select required name="status_id" value={form.status_id} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none">
                      <option value="">Select Status</option>
                      {metadata.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">Condition *
                    <select required name="condition_id" value={form.condition_id} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none">
                      <option value="">Select Condition</option>
                      {metadata.conditions.map(c => <option key={c.id} value={c.id}>{c.name} ({c.score}/5)</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Allocation (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-gray-700">Department
                    <select name="current_department_id" value={form.current_department_id} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none">
                      <option value="">None</option>
                      {metadata.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700">Employee
                    <select name="current_employee_id" value={form.current_employee_id} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none">
                      <option value="">None</option>
                      {metadata.employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Purchase Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-gray-700">Cost ($)
                    <input type="number" name="purchase_cost" value={form.purchase_cost} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none" placeholder="1999.99" />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">Date
                    <input type="date" name="purchase_date" value={form.purchase_date} onChange={updateForm} className="mt-1 w-full p-2 border border-gray-300 rounded-sm focus:border-[#4f3448] outline-none" />
                  </label>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button onClick={() => setShowRegister(false)} className="flex-1 py-2.5 border border-gray-300 rounded-sm font-medium text-gray-700 hover:bg-white">Cancel</button>
              <button onClick={handleRegister} disabled={saving} className="flex-1 py-2.5 bg-[#4f3448] text-white rounded-sm font-medium hover:bg-[#3f2939] disabled:opacity-50">
                {saving ? 'Registering...' : 'Save & Generate QR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Details Slide-over */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
          <div className="w-[550px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-[#4f3448]/5">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-white rounded-sm border border-gray-200 p-1 shadow-sm flex items-center justify-center">
                  <HardDrive size={32} className="text-[#4f3448]/50" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{selectedAsset.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-sm text-[#4f3448] bg-[#4f3448]/10 px-2 py-0.5 rounded-sm"><Tag size={12} className="inline mr-1"/>{selectedAsset.asset_tag}</span>
                    <span className="text-sm px-2 py-0.5 bg-gray-100 border rounded-full text-gray-600">{selectedAsset.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-white rounded-full text-gray-500"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* QR Code Section */}
              <div className="bg-gradient-to-br from-[#4f3448]/5 to-transparent p-6 rounded-sm border border-[#4f3448]/10 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#4f3448] flex items-center gap-2"><QrCode size={18}/> Digital Identity</h3>
                  <p className="text-sm text-gray-600 mt-1 max-w-[200px]">Scan this code with any mobile device to view asset details and perform audits.</p>
                  <button className="mt-4 text-xs font-semibold text-[#4f3448] border border-[#4f3448] px-3 py-1.5 rounded-sm hover:bg-[#4f3448] hover:text-white transition-colors">
                    Download Tag
                  </button>
                </div>
                <div className="w-32 h-32 bg-white rounded-sm border border-gray-200 shadow-sm p-2">
                  {selectedAsset.qr_code_url ? (
                    <img src={selectedAsset.qr_code_url} alt="QR Code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-xs text-gray-400 text-center">No QR Generated</div>
                  )}
                </div>
              </div>

              {/* Specs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Specifications</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div><p className="text-gray-500">Category</p><p className="font-medium">{selectedAsset.category_name}</p></div>
                  <div><p className="text-gray-500">Condition</p><p className="font-medium">{selectedAsset.condition}</p></div>
                  <div><p className="text-gray-500">Serial Number</p><p className="font-mono">{selectedAsset.serial_number || 'N/A'}</p></div>
                  <div><p className="text-gray-500">Purchase Date</p><p className="font-medium">{selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}</p></div>
                  <div><p className="text-gray-500">Purchase Cost</p><p className="font-medium text-green-600">{selectedAsset.purchase_cost ? `$${selectedAsset.purchase_cost}` : 'N/A'}</p></div>
                </div>
              </div>

              {/* Allocation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Current Allocation</h3>
                <div className="bg-gray-50 rounded-sm border border-gray-200 p-4">
                  {selectedAsset.first_name ? (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#4f3448] text-white flex items-center justify-center font-bold">
                        {selectedAsset.first_name[0]}{selectedAsset.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedAsset.first_name} {selectedAsset.last_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Building2 size={12}/> {selectedAsset.department_name}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">This asset is currently in storage and unassigned.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
