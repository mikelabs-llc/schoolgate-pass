import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Term {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  fee_amount: number;
  is_active: boolean;
  created_at: string;
}

const termSchema = z.object({
  name: z.string().min(1, 'Term name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  fee_amount: z.string().min(1, 'Fee amount is required'),
  is_active: z.boolean(),
});

export const TermsManagementTab = () => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof termSchema>>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
      fee_amount: '',
      is_active: false,
    },
  });

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('terms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTerms(data || []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch terms.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof termSchema>) => {
    try {
      const termData = {
        name: values.name,
        start_date: values.start_date,
        end_date: values.end_date,
        fee_amount: parseFloat(values.fee_amount),
        is_active: values.is_active,
      };

      if (editingTerm) {
        const { error } = await supabase
          .from('terms')
          .update(termData)
          .eq('id', editingTerm.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Term updated successfully.',
        });
      } else {
        const { error } = await supabase
          .from('terms')
          .insert([termData]);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Term created successfully.',
        });
      }

      setDialogOpen(false);
      form.reset();
      setEditingTerm(null);
      fetchTerms();
    } catch (error) {
      console.error('Error saving term:', error);
      toast({
        title: 'Error',
        description: 'Failed to save term.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (term: Term) => {
    setEditingTerm(term);
    form.setValue('name', term.name);
    form.setValue('start_date', term.start_date);
    form.setValue('end_date', term.end_date);
    form.setValue('fee_amount', term.fee_amount.toString());
    form.setValue('is_active', term.is_active);
    setDialogOpen(true);
  };

  const toggleActiveStatus = async (term: Term) => {
    try {
      const { error } = await supabase
        .from('terms')
        .update({ is_active: !term.is_active })
        .eq('id', term.id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Term ${!term.is_active ? 'activated' : 'deactivated'} successfully.`,
      });
      
      fetchTerms();
    } catch (error) {
      console.error('Error updating term status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update term status.',
        variant: 'destructive',
      });
    }
  };

  const getActiveTerm = () => terms.find(term => term.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 animate-pulse text-navy mx-auto mb-4" />
          <p className="text-muted-foreground">Loading terms...</p>
        </div>
      </div>
    );
  }

  const activeTerm = getActiveTerm();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Terms & Fee Management</h2>
          <p className="text-muted-foreground">Manage school terms and fee structures</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingTerm(null);
                form.reset();
              }}
              className="bg-navy hover:bg-navy-dark text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Term
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTerm ? 'Edit Term' : 'Add New Term'}</DialogTitle>
              <DialogDescription>
                {editingTerm ? 'Update term details' : 'Create a new academic term'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Term 1 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fee_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Amount (KSH)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Term</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this the current active term
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-navy hover:bg-navy-dark text-white"
                  >
                    {editingTerm ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Term Summary */}
      {activeTerm && (
        <Card className="border-navy/20">
          <CardHeader className="bg-gradient-to-r from-navy to-navy-light text-white">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Active Term
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="font-semibold text-navy">{activeTerm.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {format(new Date(activeTerm.start_date), 'MMM dd')} - {format(new Date(activeTerm.end_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Fee Amount</p>
                <p className="font-bold text-navy flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  KSH {activeTerm.fee_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terms Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Terms</CardTitle>
          <CardDescription>
            Manage all academic terms and their fee structures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Fee Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terms.map((term) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.name}</TableCell>
                  <TableCell>
                    {format(new Date(term.start_date), 'MMM dd')} - {format(new Date(term.end_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="font-mono">
                    KSH {term.fee_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={term.is_active ? "default" : "secondary"}
                      className={term.is_active ? "bg-navy hover:bg-navy-dark" : ""}
                    >
                      {term.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(term)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant={term.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleActiveStatus(term)}
                        className={!term.is_active ? "bg-navy hover:bg-navy-dark text-white" : ""}
                      >
                        {term.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {terms.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No terms created yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};