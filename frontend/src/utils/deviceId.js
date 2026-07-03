export function getDeviceId() {
  let id = localStorage.getItem('tertip_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('tertip_device_id', id);
  }
  return id;
}
