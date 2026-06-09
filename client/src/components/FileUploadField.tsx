import { Button, Chip, Typography, Box } from '@mui/material';

interface FileUploadFieldProps {
  label: string;
  buttonLabel: string;
  file: File | null;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function FileUploadField({
  label,
  buttonLabel,
  file,
  accept,
  onChange,
  onClear,
}: FileUploadFieldProps) {
  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        {label}
      </Typography>
      <Button variant="outlined" component="label" fullWidth>
        {file?.name ?? buttonLabel}
        <input type="file" hidden accept={accept} onChange={onChange} />
      </Button>
      {file ? (
        <Chip label={file.name} color="success" size="small" sx={{ mt: 1 }} onDelete={onClear} />
      ) : null}
    </Box>
  );
}
