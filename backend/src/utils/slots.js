// Slot yardımcıları — 30 dakikalık randevu dilimleri
// Mesai penceresi: 09:00–17:00 → slotlar 09:00, 09:30, ... , 16:30 (son slot 16:30).

const START_HOUR = 9; // 09:00
const END_HOUR = 17; // 17:00 (dahil değil — son slot 16:30)
const STEP_MIN = 30;

// "HH:mm" formatında tüm slotları üretir.
function generateSlots() {
  const slots = [];
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += STEP_MIN) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

// "HH:mm" → dakika (ör. "09:30" → 570)
function slotToMinutes(slot) {
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m;
}

module.exports = { generateSlots, slotToMinutes, START_HOUR, END_HOUR, STEP_MIN };
