import Timetable, { WeekDay } from '../models/Timetable.model';
import Attendance from '../models/Attendance.model';
import Department from '../models/Department.model';
import Subject from '../models/Subject.model';

export interface DashboardOverviewResponse {
  date: string;
  time: string;
  totalAssignedClasses: number;
  totalClassesToTake: number;
  totalClassesCompleted: number;
}

export const getTeacherDashboardOverviewService = async (teacherId: string): Promise<DashboardOverviewResponse> => {
  // TODO: connect timetable collection
  // TODO: connect attendance collection

  const now = new Date();

  // 1. Get current date and time in Indian Standard Time (IST)
  const optionsTime = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  } as const;

  const timeFormatter = new Intl.DateTimeFormat('en-US', optionsTime);
  const timeStr = `${timeFormatter.format(now)} IST`;

  const optionsDate = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  } as const;

  const dateFormatter = new Intl.DateTimeFormat('en-GB', optionsDate);
  const dateStr = dateFormatter.format(now);

  // 2. Fetch teacher classes assigned for today
  const optionsDay = {
    timeZone: 'Asia/Kolkata',
    weekday: 'long'
  } as const;
  const dayOfWeek = new Intl.DateTimeFormat('en-US', optionsDay).format(now) as WeekDay;

  // Query timetable for classes assigned to the teacher on this day of the week
  const timetablesToday = await Timetable.find({ teacherId, day: dayOfWeek });
  const totalAssignedClasses = timetablesToday.length;

  // 3. Query attendance marked today to calculate completed classes
  // Date boundaries for today in Indian Standard Time (IST, UTC+5:30)
  const startOfToday = new Date(now);
  startOfToday.setMinutes(startOfToday.getMinutes() + 330);
  startOfToday.setUTCHours(0, 0, 0, 0);
  startOfToday.setMinutes(startOfToday.getMinutes() - 330);

  const endOfToday = new Date(startOfToday);
  endOfToday.setUTCHours(23, 59, 59, 999);

  // Find timetable IDs from today's scheduled classes that have attendance marked
  const completedTimetableIds = await Attendance.distinct('timetableId', {
    teacherId,
    date: { $gte: startOfToday, $lte: endOfToday },
    timetableId: { $in: timetablesToday.map((t) => t._id) }
  });

  const totalClassesCompleted = completedTimetableIds.length;
  const totalClassesToTake = Math.max(totalAssignedClasses - totalClassesCompleted, 0);

  return {
    date: dateStr,
    time: timeStr,
    totalAssignedClasses,
    totalClassesToTake,
    totalClassesCompleted
  };
};

export interface TeacherDashboardClassItem {
  id: string;
  subject: string;
  dept: string;
  section: string;
  classTiming: string;
  status: 'pending' | 'complete';
}

export const getTeacherDashboardClassesService = async (teacherId: string): Promise<TeacherDashboardClassItem[]> => {
  // TODO connect timetable
  // TODO connect attendance

  const now = new Date();

  // 1. Get current weekday in IST
  const optionsDay = {
    timeZone: 'Asia/Kolkata',
    weekday: 'long'
  } as const;
  const dayOfWeek = new Intl.DateTimeFormat('en-US', optionsDay).format(now) as WeekDay;

  // 2. Fetch today's teacher schedule
  const timetablesToday = await Timetable.find({ teacherId, day: dayOfWeek })
    .populate({ path: 'subjectId', select: 'name code' })
    .populate({ path: 'departmentId', select: 'name code' });

  // 3. Query attendance marked today to verify status
  const startOfToday = new Date(now);
  startOfToday.setMinutes(startOfToday.getMinutes() + 330);
  startOfToday.setUTCHours(0, 0, 0, 0);
  startOfToday.setMinutes(startOfToday.getMinutes() - 330);

  const endOfToday = new Date(startOfToday);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const completedTimetableIds = await Attendance.distinct('timetableId', {
    teacherId,
    date: { $gte: startOfToday, $lte: endOfToday },
    timetableId: { $in: timetablesToday.map((t) => t._id) }
  });

  const completedSet = new Set(completedTimetableIds.map(id => id.toString()));

  // 4. Map timetables to response objects
  const classesList: TeacherDashboardClassItem[] = timetablesToday.map((t) => {
    const isComplete = completedSet.has(t._id.toString());
    
    const subjectName = typeof t.subjectId === 'object' && t.subjectId && 'name' in t.subjectId
      ? (t.subjectId as any).name
      : 'Unknown Subject';
      
    const deptName = typeof t.departmentId === 'object' && t.departmentId && 'name' in t.departmentId
      ? (t.departmentId as any).name
      : 'Unknown Department';

    return {
      id: t._id.toString(),
      subject: subjectName,
      dept: deptName,
      section: t.section,
      classTiming: `${t.startTime} - ${t.endTime}`,
      status: isComplete ? 'complete' : 'pending'
    };
  });

  // 5. Sort: pending first, complete last
  classesList.sort((a, b) => {
    if (a.status === 'pending' && b.status === 'complete') return -1;
    if (a.status === 'complete' && b.status === 'pending') return 1;
    return 0;
  });

  return classesList;
};

export interface DropdownItem {
  id: string;
  name: string;
}

export const getAttendanceDepartmentsService = async (): Promise<DropdownItem[]> => {
  // TODO connect department collection
  return [
    { id: "dept-1", name: "Computer Science (CS)" },
    { id: "dept-2", name: "Electrical Engineering (EE)" },
    { id: "dept-3", name: "Mechanical Engineering (ME)" }
  ];
};

export const getAttendanceSectionsService = async (): Promise<DropdownItem[]> => {
  // TODO connect section collection
  return [
    { id: "A", name: "Section A" },
    { id: "B", name: "Section B" },
    { id: "C", name: "Section C" }
  ];
};

export const getAttendanceSemestersService = async (): Promise<DropdownItem[]> => {
  return [
    { id: "1", name: "Semester 1" },
    { id: "2", name: "Semester 2" },
    { id: "3", name: "Semester 3" },
    { id: "4", name: "Semester 4" },
    { id: "5", name: "Semester 5" },
    { id: "6", name: "Semester 6" },
    { id: "7", name: "Semester 7" },
    { id: "8", name: "Semester 8" }
  ];
};

export const getAttendanceSubjectsService = async (): Promise<DropdownItem[]> => {
  // TODO connect subject collection
  return [
    { id: "sub-1", name: "Discrete Mathematics (CS-101)" },
    { id: "sub-2", name: "Data Structures (CS-202)" },
    { id: "sub-3", name: "Database Systems (CS-303)" }
  ];
};
