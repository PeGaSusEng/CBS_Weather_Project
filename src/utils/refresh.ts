export async function restartSchedulerVisibelAwan() {
  const response = await fetch('https://cbmweather.my.id/api/restart-scheduler-visibel-awan', {
    method: 'POST',
    headers: {
      'Authorization': 'laodeAbinAkbar2108Muna',
      'Content-Type': 'application/json'
    },
  });
  const data = await response.json();
  return { ok: response.ok, ...data };
}
