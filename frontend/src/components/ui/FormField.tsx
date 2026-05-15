import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type FormFieldProps = {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  name: string;
  onBlur: React.FocusEventHandler<HTMLInputElement>;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  ref: React.Ref<HTMLInputElement>;
};

export function FormField({ id, label, type = 'text', placeholder, autoComplete, error, ...registration }: FormFieldProps) {
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
