import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: number;
  name: string;
  class: string;
}

interface AttendanceRecord {
  id: number;
  student_id: number;
  date: string;
  status: string;
  student?: Student;
}

export const AttendanceTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchAttendance();
  }, [selectedDate, selectedClass]);

  const fetchStudents = async () => {
    const query = supabase.from('Students').select('id, name, class').order('name');
    
    if (selectedClass !== 'all') {
      query.eq('class', selectedClass);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const fetchAttendance = async () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        Students!inner(id, name, class)
      `)
      .eq('date', dateStr);

    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      setAttendance(data || []);
    }
  };

  const getClasses = () => {
    const classes = Array.from(new Set(students.map(s => s.class)));
    return classes.sort();
  };

  const markAttendance = async (studentId: number, status: 'Present' | 'Absent') => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // Check if attendance record exists
    const existingRecord = attendance.find(a => a.student_id === studentId);
    
    let result;
    if (existingRecord) {
      // Update existing record
      result = await supabase
        .from('attendance')
        .update({ status })
        .eq('id', existingRecord.id);
    } else {
      // Create new record
      result = await supabase
        .from('attendance')
        .insert([{
          student_id: studentId,
          date: dateStr,
          status,
        }]);
    }

    if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Attendance marked as ${status}`,
      });
      fetchAttendance();
    }
  };

  const getStudentAttendance = (studentId: number) => {
    return attendance.find(a => a.student_id === studentId);
  };

  const getTodayStats = () => {
    const total = students.length;
    const present = attendance.filter(a => a.status === 'Present').length;
    const absent = attendance.filter(a => a.status === 'Absent').length;
    const unmarked = total - present - absent;

    return { total, present, absent, unmarked };
  };

  if (loading) {
    return <div className="text-center py-8">Loading attendance...</div>;
  }

  const stats = getTodayStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-muted-foreground">Mark daily attendance for students</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {getClasses().map((cls) => (
                <SelectItem key={cls} value={cls}>
                  Class {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.unmarked}</div>
            <p className="text-xs text-muted-foreground">Unmarked</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')} - {selectedClass === 'all' ? 'All Classes' : `Class ${selectedClass}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const attendanceRecord = getStudentAttendance(student.id);
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      {attendanceRecord ? (
                        <Badge 
                          variant={attendanceRecord.status === 'Present' ? 'default' : 'destructive'}
                        >
                          {attendanceRecord.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Unmarked</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={attendanceRecord?.status === 'Present' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'Present')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={attendanceRecord?.status === 'Absent' ? 'destructive' : 'outline'}
                          onClick={() => markAttendance(student.id, 'Absent')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No students found for the selected class.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};