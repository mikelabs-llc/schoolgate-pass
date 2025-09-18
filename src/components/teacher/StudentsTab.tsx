import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Key } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  class: string;
  parent_email: string | null;
  parent_phone: string | null;
  child_uid: string | null;
  parent_password: string | null;
  access_url: string | null;
}

export const StudentsTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    parent_email: '',
    parent_phone: '',
    child_uid: '',
    parent_password: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('Students')
      .select('*')
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

  const generateCredentials = () => {
    const uid = Math.random().toString(36).substring(2, 10).toUpperCase();
    const password = Math.random().toString(36).substring(2, 10);
    const url = `${window.location.origin}/parent-auth?uid=${uid}`;
    
    setFormData(prev => ({
      ...prev,
      child_uid: uid,
      parent_password: password,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const studentData = {
      ...formData,
      access_url: `${window.location.origin}/parent-auth?uid=${formData.child_uid}`,
    };

    let result;
    if (editingStudent) {
      result = await supabase
        .from('Students')
        .update(studentData)
        .eq('id', editingStudent.id);
    } else {
      result = await supabase
        .from('Students')
        .insert([studentData]);
    }

    if (result.error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingStudent ? 'update' : 'add'} student`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Student ${editingStudent ? 'updated' : 'added'} successfully`,
      });
      setDialogOpen(false);
      resetForm();
      fetchStudents();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      class: '',
      parent_email: '',
      parent_phone: '',
      child_uid: '',
      parent_password: '',
    });
    setEditingStudent(null);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      class: student.class,
      parent_email: student.parent_email || '',
      parent_phone: student.parent_phone || '',
      child_uid: student.child_uid || '',
      parent_password: student.parent_password || '',
    });
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    generateCredentials();
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground">Manage student records and parent access</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </DialogTitle>
              <DialogDescription>
                {editingStudent ? 'Update student information' : 'Add a new student with parent access credentials'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Student Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      value={formData.class}
                      onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parent_email">Parent Email</Label>
                    <Input
                      id="parent_email"
                      type="email"
                      value={formData.parent_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent_phone">Parent Phone</Label>
                    <Input
                      id="parent_phone"
                      value={formData.parent_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, parent_phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Parent Access Credentials</Label>
                    <Button type="button" onClick={generateCredentials} size="sm" variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Generate New
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="child_uid">Child ID</Label>
                      <Input
                        id="child_uid"
                        value={formData.child_uid}
                        onChange={(e) => setFormData(prev => ({ ...prev, child_uid: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parent_password">Parent Password</Label>
                      <Input
                        id="parent_password"
                        value={formData.parent_password}
                        onChange={(e) => setFormData(prev => ({ ...prev, parent_password: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStudent ? 'Update Student' : 'Add Student'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            {students.length} student{students.length !== 1 ? 's' : ''} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>Child ID</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{student.parent_email}</div>
                      <div className="text-muted-foreground">{student.parent_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {student.child_uid || 'Not set'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {student.parent_password || 'Not set'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No students found. Add your first student to get started.
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