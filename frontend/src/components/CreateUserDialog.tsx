import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { createUserSchema } from '@repo/shared/schemas/user';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type CreateUserFormData = z.infer<typeof createUserSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormFieldProps = {
  id: keyof CreateUserFormData;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
} & ReturnType<ReturnType<typeof useForm<CreateUserFormData>>['register']>;

function FormField({ id, label, type = 'text', placeholder, autoComplete, error, ...registration }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        {...registration}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default function CreateUserDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUserFormData) =>
      axios.post(`${API_URL}/api/users`, data, { withCredentials: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.error ?? 'Failed to create user.')
        : 'Failed to create user.';
      setError('root', { message });
    },
  });

  function onSubmit(data: CreateUserFormData) {
    return mutation.mutateAsync(data);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <FormField
            id="name"
            label="Name"
            placeholder="Jane Smith"
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="jane@example.com"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {errors.root && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create agent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
