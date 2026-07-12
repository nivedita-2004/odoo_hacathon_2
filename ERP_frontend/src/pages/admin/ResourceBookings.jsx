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
  X,
  XCircle,
} from "lucide-react";

const resources = [
  "Meeting Room B2",
  "Conference Hall A",
  "Training Room C1",
  "Projector Kit 01",
  "Company Vehicle 02",
];
const todayString = new Date().toISOString().slice(0, 10);
const initialBookings = [
  {
    id: "BK-0101",
    resource: "Meeting Room B2",
    title: "Product Sprint Planning",
    bookedBy: "Priya Sharma",
    department: "Information Technology",
    date: todayString,
    start: "09:00",
    end: "10:00",
    reminder: 15,
    status: "Upcoming",
  },
  {
    id: "BK-0102",
    resource: "Meeting Room B2",
    title: "Finance Review",
    bookedBy: "Neha Kapoor",
    department: "Finance",
    date: todayString,
    start: "11:00",
    end: "12:30",
    reminder: 30,
    status: "Upcoming",
  },
  {
    id: "BK-0103",
    resource: "Conference Hall A",
    title: "Town Hall",
    bookedBy: "Rahul Verma",
    department: "Human Resources",
    date: todayString,
    start: "14:00",
    end: "16:00",
    reminder: 30,
    status: "Upcoming",
  },
  {
    id: "BK-0098",
    resource: "Training Room C1",
    title: "Employee Onboarding",
    bookedBy: "Ananya Mehta",
    department: "Human Resources",
    date: "2026-07-10",
    start: "10:00",
    end: "12:00",
    reminder: 15,
    status: "Completed",
  },
];
const departments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Operations",
  "Administration",
];
const emptyForm = {
  resource: "Meeting Room B2",
  title: "",
  bookedBy: "",
  department: "",
  date: todayString,
  start: "09:00",
  end: "10:00",
  reminder: "15",
};

const readBookings = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("assetflow_bookings")) || initialBookings
    );
  } catch {
    return initialBookings;
  }
};
const minutes = (time) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};
const formatTime = (time) =>
  new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
const getStatus = (booking) => {
  if (booking.status === "Cancelled") return "Cancelled";
  const now = new Date();
  const start = new Date(`${booking.date}T${booking.start}:00`);
  const end = new Date(`${booking.date}T${booking.end}:00`);
  if (now >= end) return "Completed";
  if (now >= start && now < end) return "Ongoing";
  return "Upcoming";
};

export default function ResourceBookings({ scopeDepartment = null, scopeBookedBy = null }) {
  const [bookings, setBookings] = useState(readBookings);
  const [resource, setResource] = useState("Meeting Room B2");
  const [date, setDate] = useState(todayString);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("assetflow_bookings", JSON.stringify(bookings));
    const reminders = bookings
      .filter((item) => getStatus(item) === "Upcoming" && item.reminder > 0)
      .map((item) => ({
        id: item.id,
        message: `${item.resource} booking starts at ${formatTime(item.start)}`,
        remindBefore: item.reminder,
        date: item.date,
      }));
    localStorage.setItem(
      "assetflow_booking_reminders",
      JSON.stringify(reminders),
    );
  }, [bookings]);

  const calendarBookings = bookings
    .filter(
      (item) =>
        item.resource === resource &&
        item.date === date &&
        (!scopeDepartment || scopeBookedBy || item.department === scopeDepartment) &&
        getStatus(item) !== "Cancelled",
    )
    .sort((a, b) => a.start.localeCompare(b.start));
  const visible = useMemo(
    () =>
      bookings.filter((item) =>
        (!scopeDepartment || item.department === scopeDepartment) &&
        (!scopeBookedBy || item.bookedBy === scopeBookedBy) &&
        [
          item.id,
          item.resource,
          item.title,
          item.bookedBy,
          item.department,
        ].some((value) => value.toLowerCase().includes(search.toLowerCase())),
      ),
    [bookings, search, scopeDepartment, scopeBookedBy],
  );
  const withStatuses = bookings.filter((item) => (!scopeDepartment || item.department === scopeDepartment) && (!scopeBookedBy || item.bookedBy === scopeBookedBy)).map((item) => ({
    ...item,
    currentStatus: getStatus(item),
  }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, resource, date, department: scopeDepartment || "", bookedBy: scopeBookedBy || "" });
    setError("");
  };
  const openReschedule = (booking) => {
    setEditingId(booking.id);
    setForm({ ...booking, reminder: String(booking.reminder) });
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

  const saveBooking = (event) => {
    event.preventDefault();
    if (minutes(form.end) <= minutes(form.start))
      return setError("End time must be later than start time.");
    const overlapping = bookings.find(
      (item) =>
        item.id !== editingId &&
        item.resource === form.resource &&
        item.date === form.date &&
        getStatus(item) !== "Cancelled" &&
        minutes(form.start) < minutes(item.end) &&
        minutes(form.end) > minutes(item.start),
    );
    if (overlapping)
      return setError(
        `${form.resource} is already booked by ${overlapping.bookedBy} from ${formatTime(overlapping.start)} to ${formatTime(overlapping.end)}. Please choose another time.`,
      );
    const saved = {
      ...form,
      id: editingId || `BK-${String(104 + bookings.length).padStart(4, "0")}`,
      reminder: Number(form.reminder),
      status: "Upcoming",
    };
    setBookings(
      editingId
        ? bookings.map((item) => (item.id === editingId ? saved : item))
        : [saved, ...bookings],
    );
    setResource(saved.resource);
    setDate(saved.date);
    close();
  };
  const cancel = (id) =>
    setBookings(
      bookings.map((item) =>
        item.id === id ? { ...item, status: "Cancelled" } : item,
      ),
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#7a6475]">Shared resources</p>
          <h1 className="mt-1 text-2xl font-bold text-[#31232e]">
            Resource Bookings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Schedule shared resources with overlap protection, reminders and
            complete booking control.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-[#4f3448] px-4 py-2.5 text-sm font-medium text-white"
          onClick={openCreate}
        >
          <Plus size={18} />
          New Booking
        </button>
      </div>
      <section className="grid grid-cols-4 gap-4">
        {[
          [
            "Upcoming",
            withStatuses.filter((item) => item.currentStatus === "Upcoming")
              .length,
            CalendarDays,
          ],
          [
            "Ongoing",
            withStatuses.filter((item) => item.currentStatus === "Ongoing")
              .length,
            Clock3,
          ],
          [
            "Completed",
            withStatuses.filter((item) => item.currentStatus === "Completed")
              .length,
            CheckCircle2,
          ],
          [
            "Cancelled",
            withStatuses.filter((item) => item.currentStatus === "Cancelled")
              .length,
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
                value={resource}
                onChange={(event) => setResource(event.target.value)}
              >
                {resources.map((item) => (
                  <option key={item}>{item}</option>
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
              const top = ((minutes(item.start) - 480) / 60) * 64;
              const height =
                ((minutes(item.end) - minutes(item.start)) / 60) * 64;
              return (
                <button
                  key={item.id}
                  className="absolute left-3 right-3 overflow-hidden rounded-lg border-l-4 border-[#4f3448] bg-[#f1eaf0] px-3 py-2 text-left text-xs text-[#4f3448]"
                  style={{
                    top: Math.max(0, top),
                    height: Math.max(40, height),
                  }}
                  onClick={() => (!scopeBookedBy || item.bookedBy === scopeBookedBy) && openReschedule(item)}
                >
                  <strong>{scopeBookedBy && item.bookedBy !== scopeBookedBy ? "Unavailable" : item.title}</strong>
                  <span className="mt-1 block">
                    {formatTime(item.start)}–{formatTime(item.end)} ·{" "}
                    {scopeBookedBy && item.bookedBy !== scopeBookedBy ? "Existing booking" : item.bookedBy}
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
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-[#4f3448]">{item.id}</p>
                      <p className="text-xs text-slate-500">{item.title}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.resource}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.bookedBy}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.department}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.date}</td>
                    <td className="px-4 py-4 font-medium text-[#31232e]">
                      {formatTime(item.start)}–{formatTime(item.end)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Bell size={14} />
                        {item.reminder ? `${item.reminder} min before` : "Off"}
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
            </tbody>
          </table>
        </div>
      </section>
      {form && (
        <BookingModal
          form={form}
          setForm={setForm}
          error={error}
          update={updateForm}
          save={saveBooking}
          close={close}
          editing={Boolean(editingId)}
          scopeDepartment={scopeDepartment}
          scopeBookedBy={scopeBookedBy}
        />
      )}
    </div>
  );
}

function BookingModal({ form, error, update, save, close, editing, scopeDepartment, scopeBookedBy }) {
  const input =
    "mt-2 w-full rounded-lg border border-[#ddd3da] px-3 py-2.5 outline-none focus:border-[#4f3448]";
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/35 p-6">
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
              Overlapping time slots for the same resource will be blocked.
            </p>
          </div>
          <button type="button" onClick={close}>
            <X size={19} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Resource">
            <select
              className={input}
              name="resource"
              value={form.resource}
              onChange={update}
            >
              {resources.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Booking Title">
            <input
              required
              disabled={Boolean(scopeBookedBy)}
              className={input}
              name="title"
              value={form.title}
              onChange={update}
            />
          </Field>
          <Field label="Booked By">
            <input
              required
              className={input}
              name="bookedBy"
              value={form.bookedBy}
              onChange={update}
            />
          </Field>
          <Field label="Department">
            <select
              required
              disabled={Boolean(scopeDepartment)}
              className={input}
              name="department"
              value={form.department}
              onChange={update}
            >
              <option value="">Select department</option>
              {departments.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
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
        <div className="mt-6 flex justify-end gap-3">
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
