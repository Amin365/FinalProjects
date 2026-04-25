import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import api from '@/app/api/apislice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { extractArrayPayload } from '@/lib/utils';

const GOAL_TYPE_LABELS = {
  pages_per_day: 'Pages / Day',
  minutes_per_day: 'Minutes / Day',
  reports_per_week: 'Reports / Week',
};

const GOAL_TYPE_COLORS = {
  pages_per_day: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  minutes_per_day: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  reports_per_week: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const EMPTY_FORM = {
  goalType: 'pages_per_day',
  targetValue: '',
  startDate: new Date().toISOString().slice(0, 10),
};

function GoalSkeleton() {
  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardContent className="pt-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const user = useSelector((state) => state.auth.user);
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: goals = [], isLoading, isError } = useQuery({
    queryKey: ['my-goals'],
    queryFn: async () => {
      const res = await api.get('/users/me/goals');
      return extractArrayPayload(res.data);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/users/me/goals', body),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-goals']);
      setShowForm(false);
      setFormData(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/users/me/goals/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-goals']);
      setEditingGoal(null);
      setFormData(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/me/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-goals']);
      setDeleteTarget(null);
    },
  });

  function openEdit(goal) {
    setEditingGoal(goal._id);
    setFormData({
      goalType: goal.goalType,
      targetValue: String(goal.targetValue),
      startDate: goal.startDate ? goal.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setShowForm(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const body = {
      goalType: formData.goalType,
      targetValue: Number(formData.targetValue),
      startDate: formData.startDate,
    };
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal, body });
    } else {
      createMutation.mutate(body);
    }
  }

  function handleCancel() {
    setShowForm(false);
    setEditingGoal(null);
    setFormData(EMPTY_FORM);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 px-4 lg:px-6 py-6 max-w-7xl ">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-green-400" />
            My Reading Goals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set daily and weekly targets to build your reading habit
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => { setEditingGoal(null); setFormData(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> New Goal
          </Button>
        )}
      </div>

      {/* Inline form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-zinc-700 ml-6 bg-zinc-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="goalType">Goal Type</Label>
                      <Select
                        value={formData.goalType}
                        onValueChange={(v) => setFormData((p) => ({ ...p, goalType: v }))}
                      >
                        <SelectTrigger id="goalType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(GOAL_TYPE_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="targetValue">Target</Label>
                      <Input
                        id="targetValue"
                        type="number"
                        min={1}
                        required
                        value={formData.targetValue}
                        onChange={(e) => setFormData((p) => ({ ...p, targetValue: e.target.value }))}
                        placeholder="e.g. 30"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSaving}>
                      {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      <Check className="h-4 w-4 mr-1" />
                      {editingGoal ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isError && (
        <p className="text-sm text-destructive">Failed to load goals.</p>
      )}

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <GoalSkeleton key={i} />)
          : goals.map((goal) => {
              const pct = goal.currentValue != null && goal.targetValue > 0
                ? Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100)
                : 0;

              return (
                <motion.div
                  key={goal._id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-3 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={GOAL_TYPE_COLORS[goal.goalType] || 'border-zinc-600 text-zinc-400'}
                            >
                              {GOAL_TYPE_LABELS[goal.goalType] || goal.goalType}
                            </Badge>
                            {goal.status && (
                              <Badge variant="secondary" className="text-xs">
                                {goal.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Target: <span className="font-semibold text-foreground">{goal.targetValue}</span>
                            {goal.currentValue != null && (
                              <> · Current: <span className="font-semibold text-foreground">{goal.currentValue}</span></>
                            )}
                          </p>
                          {goal.startDate && (
                            <p className="text-xs text-muted-foreground">
                              Started {new Date(goal.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(goal)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(goal)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {goal.currentValue != null && (
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
      </div>

      {!isLoading && goals.length === 0 && !showForm && (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No goals yet. Create your first reading goal!</p>
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this goal ({GOAL_TYPE_LABELS[deleteTarget?.goalType] || deleteTarget?.goalType})? This action cannot be undone.
          </p>
          <Separator />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget._id)}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
