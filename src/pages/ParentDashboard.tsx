import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileEditTab } from '@/components/parent/ProfileEditTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: number;
  name: string;
  class: string;
  parent_email: string;
  parent_phone: string;
  child_uid: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
}

interface FeeRecord {
  id: number;
  amount: number;
  payment_date: string;
  method: string;
  notes: string;
}

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentData = sessionStorage.getItem('parentStudentData');
    if (!studentData) {
      navigate('/parent-auth');
      return;
    }

    const parsedStudent = JSON.parse(studentData);
    setStudent(parsedStudent);
    fetchStudentData(parsedStudent.id);
  }, [navigate]);

  const fetchStudentData = async (studentId: number) => {
    try {
      // Fetch attendance
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(30);

      // Fetch fees
      const { data: feesData } = await supabase
        .from('fee_payment')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      setAttendance(attendanceData || []);
      setFees(feesData || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = () => {
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.status === 'Present').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    return {
      totalDays,
      presentDays,
      absentDays: totalDays - presentDays,
      percentage: attendancePercentage.toFixed(1)
    };
  };

  const getTotalFees = () => {
    return fees.reduce((total, fee) => total + (fee.amount || 0), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading student information...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const stats = getAttendanceStats();
  const totalFees = getTotalFees();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            onClick={() => navigate('/parent-auth')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <p className="text-muted-foreground">Class: {student.class}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.percentage}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.presentDays} present, {stats.absentDays} absent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Fees Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalFees}</div>
              <p className="text-xs text-muted-foreground">
                {fees.length} payment{fees.length !== 1 ? 's' : ''} made
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm">{student.parent_email}</p>
                <p className="text-sm text-muted-foreground">{student.parent_phone}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>Last 10 attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2">
                  <span className="text-sm">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </span>
                  <Badge 
                    variant={record.status === 'Present' ? 'default' : 'destructive'}
                  >
                    {record.status}
                  </Badge>
                </div>
              ))}
              {attendance.length === 0 && (
                <p className="text-sm text-muted-foreground">No attendance records found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fee Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Payment History</CardTitle>
            <CardDescription>All fee payments made</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fees.map((fee) => (
                <div key={fee.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">₹{fee.amount}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(fee.payment_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Method: {fee.method}</span>
                    {fee.notes && <span>Notes: {fee.notes}</span>}
                  </div>
                </div>
              ))}
              {fees.length === 0 && (
                <p className="text-sm text-muted-foreground">No fee payments found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ParentDashboard;