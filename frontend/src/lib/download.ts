import { useAuthStore } from '../store/authStore';

export async function downloadAdminStudentReport(params: {
  departmentId?: string;
  semester?: string;
  search?: string;
}): Promise<void> {
  const token = useAuthStore.getState().token;
  const qs = new URLSearchParams();
  if (params.departmentId) qs.set('departmentId', params.departmentId);
  if (params.semester) qs.set('semester', params.semester);
  if (params.search?.trim()) qs.set('search', params.search.trim());

  const res = await fetch(`/api/admin/students/export?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Download failed' }));
    throw new Error(err.message || 'Download failed');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `sams_students_attendance.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
