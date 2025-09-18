import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Student {
  id: number;
  name: string;
  class: string;
}

interface FeeRecord {
  id: number;
  student_id: number;
  amount: number;
  payment_date: string;
  method: string;
  notes: string | null;
  Students?: Student;
}

export const FeesTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    payment_date: new Date(),
    method: '',
    notes: '',
  });

  useEffect(() => {
    fetchStudents();
    fetchFees();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('Students')
      .select('id, name, class')
      .order('name');

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

  const fetchFees = async () => {
    const { data, error } = await supabase
      .from('fee_payment')
      .select(`
        *,
        Students!inner(id, name, class)
      `)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching fees:', error);
    } else {
      setFees(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const feeData = {
      student_id: parseInt(formData.student_id),
      amount: parseFloat(formData.amount),
      payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
      method: formData.method,
      notes: formData.notes || null,
    };

    const { error } = await supabase
      .from('fee_payment')
      .insert([feeData]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to record fee payment',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Fee payment recorded successfully',
      });
      setDialogOpen(false);
      resetForm();
      fetchFees();
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      amount: '',
      payment_date: new Date(),
      method: '',
      notes: '',
    });
  };

  const getTotalFees = () => {
    return fees.reduce((total, fee) => total + fee.amount, 0);
  };

  const getMonthlyTotal = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return fees
      .filter(fee => {
        const feeDate = new Date(fee.payment_date);
        return feeDate.getMonth() === currentMonth && feeDate.getFullYear() === currentYear;
      })
      .reduce((total, fee) => total + fee.amount, 0);
  };

  if (loading) {
    return <div className="text-center py-8">Loading fee records...</div>;
  }

  const totalFees = getTotalFees();
  const monthlyTotal = getMonthlyTotal();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Fee Management</h2>
          <p className="text-muted-foreground">Record and track fee payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Fee Payment</DialogTitle>
              <DialogDescription>
                Add a new fee payment record for a student
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} - Class {student.class}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method">Payment Method</Label>
                    <Select
                      value={formData.method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, method: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.payment_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.payment_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, payment_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the payment"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Total Collected</div>
            </div>
            <div className="text-2xl font-bold">₹{totalFees.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">This Month</div>
            </div>
            <div className="text-2xl font-bold">₹{monthlyTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium">Total Records</div>
            </div>
            <div className="text-2xl font-bold">{fees.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Payment History</CardTitle>
          <CardDescription>
            All recorded fee payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">
                    {fee.Students?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>{fee.Students?.class || 'N/A'}</TableCell>
                  <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                  <TableCell>{fee.method}</TableCell>
                  <TableCell>
                    {format(new Date(fee.payment_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {fee.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {fees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No fee payments recorded yet.
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