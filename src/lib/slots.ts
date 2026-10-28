export type AvailabilityWindow = { dayOfWeek: number; startTime: string; endTime: string };

export const SLOT_MINUTES = 60;

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// Day of week (0 = Sunday) for a "YYYY-MM-DD" date, independent of the server time zone.
export function dayOfWeek(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

// One-hour start times inside the technician's hours for that day, minus taken slots.
// For today, slots that have already started are left out.
export function availableSlots(
  windows: AvailabilityWindow[],
  date: string,
  taken: string[],
  now?: { date: string; time: string }
) {
  const day = dayOfWeek(date);
  const blocked = new Set(taken);
  const earliest = now && now.date === date ? toMinutes(now.time) : -1;
  const slots: string[] = [];

  for (const w of windows.filter((w) => w.dayOfWeek === day)) {
    for (let t = toMinutes(w.startTime); t + SLOT_MINUTES <= toMinutes(w.endTime); t += SLOT_MINUTES) {
      const slot = toTime(t);
      if (t > earliest && !blocked.has(slot)) slots.push(slot);
    }
  }
  return [...new Set(slots)].sort();
}

// Current date and HH:MM in India.
export function nowInIndia(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
