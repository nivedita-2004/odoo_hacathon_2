import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/apis";
import { QrCode, Wrench, ArrowRightLeft, CalendarClock, ShieldAlert, ArrowLeft } from "lucide-react";

export default function MobileAssetScan() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const token = localStorage.getItem("assetflow_token");
        const [res, timelineRes, healthRes] = await Promise.all([
          fetch(API_ENDPOINTS.ASSETS.GET_BY_ID(id), { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(API_ENDPOINTS.ASSETS.TIMELINE(id), { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(API_ENDPOINTS.ASSETS.HEALTH(id), { headers: { "Authorization": `Bearer ${token}` } })
        ]);
        const result = await res.json();
        const timelineResult = await timelineRes.json();
        const healthResult = await healthRes.json();
        if (result.success) setAsset(result.data);
        else setError(result.error);
        if (timelineResult.success) setTimeline(timelineResult.data);
        if (healthResult.success) setHealth(healthResult.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 text-[#4f3448]">
          <QrCode size={48} className="animate-pulse" />
          <p className="font-semibold uppercase tracking-wider">Scanning Asset...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-600 mb-4">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h1>
        <p className="text-gray-500 mb-8">The QR code scanned does not match any active asset in the database, or you lack permission to view it.</p>
        <Link to="/" className="rounded-full bg-[#4f3448] px-8 py-3 font-semibold text-white">Go Home</Link>
      </div>
    );
  }

  const statusColors = { Available: "bg-emerald-500", Allocated: "bg-blue-500", Reserved: "bg-violet-500", "Under Maintenance": "bg-amber-500" };
  const badgeColor = statusColors[asset.status] || "bg-gray-500";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-10 flex items-center bg-white p-4 shadow-sm">
        <Link to="/" className="mr-4 text-gray-500"><ArrowLeft size={24} /></Link>
        <h1 className="text-lg font-bold text-[#31232e]">Asset Profile</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <QrCode size={40} className="text-[#4f3448]" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{asset.name}</h2>
            <p className="mt-1 text-sm font-medium text-gray-500">{asset.asset_tag} • {asset.category}</p>
            <div className="mt-4 flex justify-center">
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${badgeColor}`}>
                {asset.status}
              </span>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 p-4 grid grid-cols-2 gap-4">
             <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Condition</p>
               <p className="mt-1 font-semibold text-gray-900">{asset.condition}</p>
             </div>
             <div>
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Holder</p>
               <p className="mt-1 font-semibold text-gray-900">{asset.current_employee_name || asset.current_department_name || 'In IT Storage'}</p>
             </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-500">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
              <div className="rounded-full bg-blue-100 p-3 text-blue-700"><ArrowRightLeft size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Request Transfer</p>
                <p className="text-xs text-gray-500">Transfer this asset to you</p>
              </div>
            </button>
            <button className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
              <div className="rounded-full bg-amber-100 p-3 text-amber-700"><Wrench size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Report Issue</p>
                <p className="text-xs text-gray-500">Log a maintenance ticket</p>
              </div>
            </button>
            <button className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100 active:bg-gray-50">
              <div className="rounded-full bg-violet-100 p-3 text-violet-700"><CalendarClock size={24} /></div>
              <div className="text-left">
                <p className="font-bold text-gray-900">Book Resource</p>
                <p className="text-xs text-gray-500">Reserve for upcoming time</p>
              </div>
            </button>
          </div>
        </div>

        {health && (
          <div>
            <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-500">Predictive Maintenance</h3>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex items-center gap-6">
               <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 border-8"
                    style={{ borderColor: health.score > 80 ? '#10b981' : health.score > 40 ? '#f59e0b' : '#ef4444' }}>
                 <div className="text-center">
                   <p className="text-2xl font-black text-gray-900">{health.score}</p>
                   <p className="text-[9px] font-bold uppercase text-gray-400">Score</p>
                 </div>
               </div>
               <div className="flex-1">
                 <p className="font-bold text-gray-900">Health Analysis</p>
                 <p className="text-xs text-gray-500 mt-1">
                   {health.score > 80 ? 'Optimal condition. Low risk of failure.' : 
                    health.score > 40 ? 'Fair condition. Routine check recommended.' : 
                    'High risk of failure. Schedule replacement or heavy repair.'}
                 </p>
                 {health.predicted_failure_date && (
                   <p className="mt-2 text-xs font-bold text-red-500">Est. Failure: {new Date(health.predicted_failure_date).toLocaleDateString()}</p>
                 )}
               </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-3 px-1 text-xs font-bold uppercase tracking-wider text-gray-500">Lifecycle Timeline</h3>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            {timeline.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                {timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-[#4f3448]"></div>
                    <p className="text-sm font-bold text-gray-900 capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {event.actor}</p>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1">{new Date(event.time).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No lifecycle events recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
