import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Plus,
  Search,
  Settings,
  X,
  XCircle,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/apis";

const TODAY = new Date();
const todayString = TODAY.toISOString().slice(0, 10);

const minutes = (time) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const d = new Date(timeStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatus = (booking) => {
  if (booking.status === "Cancelled") return "Cancelled";
  const now = new Date();
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  if (now >= end) return "Completed";
  if (now >= start && now < end) return "Ongoing";
  return "Upcoming";
};

export default function ResourceBookings({ scopeDepartment = null, scopeBookedBy = null }) {
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [assets, setAssets] = useState([]); // for adding new resources
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [date, setDate] = useState(todayString);
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [newResourceAssetId, setNewResourceAssetId] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("assetflow_token");
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, resourcesRes, assetsRes] = await Promise.all([
        fetch(API_ENDPOINTS.BOOKINGS.BASE, { headers }),
        fetch(API_ENDPOINTS.BOOKINGS.RESOURCES, { headers }),
        fetch(API_ENDPOINTS.ASSETS.GET_ALL, { headers })
      ]);
      const [bData, rData, aData] = await Promise.all([
        bookingsRes.json(), resourcesRes.json(), assetsRes.json()
      ]);
      if (bData.success) setBookings(bData.data);
      if (rData.success) {
        setResources(rData.data);
        if (rData.data.length > 0 && !selectedResourceId) {
          setSelectedResourceId(rData.data[0].resource_id);
        }
      }
      if (aData.success) setAssets(aData.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch booking data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calendarBookings = bookings
    .filter((item) => {
      const itemDate = new Date(item.start_time).toISOString().slice(0, 10);
      return item.resource_id === selectedResourceId &&
             itemDate === date &&
             (!scopeDepartment || scopeBookedBy || item.department_name === scopeDepartment) &&
             getStatus(item) !== "Cancelled";
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const visible = useMemo(
    () =>
      bookings.filter((item) => {
        const itemDate = new Date(item.start_time).toISOString().slice(0, 10);
        return (!scopeDepartment || item.department_name === scopeDepartment) &&
               (!scopeBookedBy || item.booked_by_name === scopeBookedBy) &&
               [
                 item.id,
                 item.resource_name,
                 item.title,
                 item.booked_by_name,
                 item.department_name,
                 itemDate
               ].some((value) => value && value.toLowerCase().includes(search.toLowerCase()));
      }),
    [bookings, search, scopeDepartment, scopeBookedBy]
  );

  const withStatuses = bookings.filter(
    (item) => (!scopeDepartment || item.department_name === scopeDepartment) && 
              (!scopeBookedBy || item.booked_by_name === scopeBookedBy)
  ).map((item) => ({
    ...item,
    currentStatus: getStatus(item),
  }));

  const openCreate = () => {
    setEditingId(null);
    setForm({
      resource_id: selectedResourceId,
      title: "",
      date: date,
      start: "09:00",
      end: "10:00",
      reminder: "15",
    });
    setError("");
  };

  const openReschedule = (booking) => {
    const itemDate = new Date(booking.start_time);
    const endDate = new Date(booking.end_time);
    setEditingId(booking.id);
    setForm({
      resource_id: booking.resource_id,
      title: booking.title,
      date: itemDate.toISOString().slice(0, 10),
      start: itemDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      end: endDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      reminder: String(booking.reminder_minutes || 0),
    });
    setError("");
  };

  const updateForm = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const close = () => {
    setForm(null);
    setEditingId(null);
    setError("");
  };

  const saveBooking = async (event) => {
    event.preventDefault();
    if (minutes(form.end) <= minutes(form.start)) {
      return setError("End time must be later than start time.");
    }
    
    // Construct real datetimes
    const start_time = new Date(`${form.date}T${form.start}:00`).toISOString();
    const end_time = new Date(`${form.date}T${form.end}:00`).toISOString();

    const payload = {
      resource_id: form.resource_id,
      title: form.title,
      start_time,
      end_time,
      reminder_minutes: parseInt(form.reminder, 10)
    };

    try {
      const url = editingId ? API_ENDPOINTS.BOOKINGS.UPDATE(editingId) : API_ENDPOINTS.BOOKINGS.BASE;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      const data = await res.json();
      
      if (data.success) {
        setSelectedResourceId(form.resource_id);
        setDate(form.date);
        close();
        fetchData();
      } else {
        setError(data.error || "Failed to save booking");
      }
    } catch (err) {
      console.error(err);
      setError("Network error saving booking");
    }
  };

  const cancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch(API_ENDPOINTS.BOOKINGS.CANCEL(id), { method: 'PUT', headers });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to cancel");
      }
    } catch (err) {
      console.error(err);
      alert("Error cancelling booking");
    }
  };

  const saveResource = async (event) => {
    event.preventDefault();
    try {
      const res = await fetch(API_ENDPOINTS.BOOKINGS.RESOURCES, {
        method: 'POST',
        headers,
        body: JSON.stringify({ asset_id: newResourceAssetId })
      });
      const data = await res.json();
      if (data.success) {
        setResourceFormOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to add resource");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding resource");
    }
  };

  if (loading && resources.length === 0) {
    return <div className="p-10 text-center text-slate-500">Loading resources...</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">Shared resources</p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
            Resource Bookings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Schedule shared resources with overlap protection, reminders and complete booking control.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            onClick={() => setResourceFormOpen(true)}
          >
            <Settings size={18} />
            Add Resource
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white"
            onClick={openCreate}
          >
            <Plus size={18} />
            New Booking
          </button>
        </div>
      </div>
      
      <section className="grid grid-cols-4 gap-4">
        {[
          [
            "Upcoming",
            withStatuses.filter((item) => item.currentStatus === "Upcoming").length,
            CalendarDays,
          ],
          [
            "Ongoing",
            withStatuses.filter((item) => item.currentStatus === "Ongoing").length,
            Clock3,
          ],
          [
            "Completed",
            withStatuses.filter((item) => item.currentStatus === "Completed").length,
            CheckCircle2,
          ],
          [
            "Cancelled",
            withStatuses.filter((item) => item.currentStatus === "Cancelled").length,
            XCircle,
          ],
        ].map(([label, value, Icon]) => (
          <div
            key={label}
            className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold text-[#31232e]">
                  {value}
                </p>
              </div>
              <div className="h-fit rounded-lg bg-[#f1eaf0] p-2.5 text-[#4f3448]">
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-[#e6dee4] bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#31232e]">
              Resource Calendar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Existing bookings for the selected resource and date.
            </p>
          </div>
          <div className="flex gap-3">
            <label className="text-xs font-medium uppercase text-slate-500">
              Resource
              <select
                className="mt-1 block min-w-56 rounded-lg border border-[#ddd3da] px-3 py-2.5 text-sm text-slate-700"
                value={selectedResourceId}
                onChange={(event) => setSelectedResourceId(event.target.value)}
              >
                {resources.length === 0 && <option value="">No resources available</option>}
                {resources.map((item) => (
                  <option key={item.resource_id} value={item.resource_id}>{item.asset_name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium uppercase text-slate-500">
              Date
              <input
                className="mt-1 block rounded-lg border border-[#ddd3da] px-3 py-2.5 text-sm text-slate-700"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-[90px_1fr] overflow-hidden rounded-lg border border-[#e6dee4]">
          <div className="bg-[#faf8fa]">
            {Array.from({ length: 11 }, (_, index) => index + 8).map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-[#eee8ed] px-3 pt-2 text-xs text-slate-500"
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          <div className="relative h-[704px] bg-white">
            {Array.from({ length: 11 }).map((_, index) => (
              <div key={index} className="h-16 border-b border-[#eee8ed]" />
            ))}
            {calendarBookings.map((item) => {
              const start = new Date(item.start_time);
              const end = new Date(item.end_time);
              const startMins = start.getHours() * 60 + start.getMinutes();
              const endMins = end.getHours() * 60 + end.getMinutes();
              
              const top = ((startMins - 480) / 60) * 64;
              const height = ((endMins - startMins) / 60) * 64;
              return (
                <button
                  key={item.id}
                  className="absolute left-3 right-3 overflow-hidden rounded-lg border-l-4 border-[#4f3448] bg-[#f1eaf0] px-3 py-2 text-left text-xs text-[#4f3448]"
                  style={{
                    top: Math.max(0, top),
                    height: Math.max(40, height),
                  }}
                  onClick={() => (!scopeBookedBy || item.booked_by_name === scopeBookedBy) && openReschedule(item)}
                >
                  <strong>{scopeBookedBy && item.booked_by_name !== scopeBookedBy ? "Unavailable" : item.title}</strong>
                  <span className="mt-1 block">
                    {formatTime(item.start_time)}–{formatTime(item.end_time)} ·{" "}
                    {scopeBookedBy && item.booked_by_name !== scopeBookedBy ? "Existing booking" : item.booked_by_name}
                  </span>
                </button>
              );
            })}
            {calendarBookings.length === 0 && (
              <p className="absolute inset-0 grid place-items-center text-sm text-slate-400">
                No bookings for this resource and date.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#e6dee4] bg-white shadow-sm">
        <div className="border-b border-[#e6dee4] p-5">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />
            <input
              className="w-full rounded-lg border border-[#ddd3da] py-2.5 pl-10 pr-3 outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search booking, resource or employee..."
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b bg-[#fcfafb] text-xs uppercase text-slate-500">
                {[
                  "Booking",
                  "Resource",
                  "Booked By",
                  "Department",
                  "Date",
                  "Time Slot",
                  "Reminder",
                  "Status",
                  "Actions",
                ].map((item) => (
                  <th key={item} className="px-4 py-3">
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const status = getStatus(item);
                const itemDate = new Date(item.start_time).toISOString().slice(0,10);
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#4f3448]">{item.id.substring(0,8)}...</p>
                      <p className="text-xs text-slate-500">{item.title}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.resource_name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.booked_by_name}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.department_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{itemDate}</td>
                    <td className="px-4 py-4 font-medium text-[#31232e]">
                      {formatTime(item.start_time)}–{formatTime(item.end_time)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Bell size={14} />
                        {item.reminder_minutes ? `${item.reminder_minutes} min before` : "Off"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Status status={status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        disabled={["Completed", "Cancelled"].includes(status)}
                        className="mr-3 inline-flex items-center gap-1 font-medium text-[#4f3448] enabled:hover:underline disabled:opacity-40"
                        onClick={() => openReschedule(item)}
                      >
                        <Edit3 size={15} />
                        Reschedule
                      </button>
                      <button
                        disabled={["Completed", "Cancelled"].includes(status)}
                        className="font-medium text-red-700 enabled:hover:underline disabled:opacity-40"
                        onClick={() => cancel(item.id)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-slate-500">
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      
      {form && (
        <BookingModal
          form={form}
          resources={resources}
          error={error}
          update={updateForm}
          save={saveBooking}
          close={close}
          editing={Boolean(editingId)}
        />
      )}

      {resourceFormOpen && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6">
          <form
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onSubmit={saveResource}
          >
            <div className="mb-5 flex justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#31232e]">Add Bookable Resource</h2>
                <p className="mt-1 text-sm text-slate-500">Select an existing asset to make it bookable by employees.</p>
              </div>
              <button type="button" onClick={() => setResourceFormOpen(false)}>
                <X size={19} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Asset">
                <select
                  required
                  className="mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]"
                  value={newResourceAssetId}
                  onChange={(e) => setNewResourceAssetId(e.target.value)}
                >
                  <option value="">Select an asset...</option>
                  {assets.filter(a => !resources.some(r => r.asset_id === a.id)).map(a => (
                    <option key={a.id} value={a.id}>{a.asset_tag} - {a.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border px-4 py-2.5"
                type="button"
                onClick={() => setResourceFormOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white"
                type="submit"
              >
                Enable Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function BookingModal({ form, resources, error, update, save, close, editing }) {
  const input =
    "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6 backdrop-blur-sm">
      <form
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        onSubmit={save}
      >
        <div className="mb-5 flex justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#31232e]">
              {editing ? "Reschedule Booking" : "New Resource Booking"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Overlapping time slots for the same resource will be blocked by the server.
            </p>
          </div>
          <button type="button" onClick={close}>
            <X size={19} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Resource">
            <select
              required
              className={input}
              name="resource_id"
              value={form.resource_id}
              onChange={update}
            >
              <option value="">Select Resource</option>
              {resources.map((item) => (
                <option key={item.resource_id} value={item.resource_id}>{item.asset_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Booking Title">
            <input
              required
              className={input}
              name="title"
              value={form.title}
              onChange={update}
              placeholder="e.g. Sprint Planning"
            />
          </Field>
          <Field label="Date">
            <input
              required
              min={todayString}
              className={input}
              name="date"
              type="date"
              value={form.date}
              onChange={update}
            />
          </Field>
          <Field label="Reminder">
            <select
              className={input}
              name="reminder"
              value={form.reminder}
              onChange={update}
            >
              <option value="0">No reminder</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
            </select>
          </Field>
          <Field label="Start Time">
            <input
              required
              className={input}
              name="start"
              type="time"
              value={form.start}
              onChange={update}
            />
          </Field>
          <Field label="End Time">
            <input
              required
              className={input}
              name="end"
              type="time"
              value={form.end}
              onChange={update}
            />
          </Field>
        </div>
        {error && (
          <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}
        <p className="mt-4 rounded-lg bg-[#f7f3f6] p-3 text-xs text-[#4f3448]">
          Example: an existing 9:00–10:00 booking blocks 9:30–10:30, while
          10:00–11:00 is allowed.
        </p>
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            className="rounded-lg border px-4 py-2.5"
            type="button"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#4f3448] px-4 py-2.5 font-medium text-white"
            type="submit"
          >
            {editing ? "Save New Time" : "Confirm Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
function Status({ status }) {
  const style = {
    Upcoming: "bg-blue-50 text-blue-700",
    Ongoing: "bg-emerald-50 text-emerald-700",
    Completed: "bg-slate-100 text-slate-600",
    Cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style[status]}`}
    >
      {status}
    </span>
  );
}
