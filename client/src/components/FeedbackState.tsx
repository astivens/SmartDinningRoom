import { ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Skeleton, Stack, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

interface FeedbackStateProps {
  type: 'loading' | 'empty' | 'error' | 'success';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  skeletonRows?: number;
  icon?: ReactNode;
}

export default function FeedbackState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
  skeletonRows = 4,
  icon,
}: FeedbackStateProps) {
  if (type === 'loading') {
    if (compact) {
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" role="status" aria-live="polite">
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            {description ?? 'Cargando información...'}
          </Typography>
        </Stack>
      );
    }

    return (
      <Box role="status" aria-live="polite" aria-busy>
        <Stack spacing={1}>
          {Array.from({ length: skeletonRows }).map((_, idx) => (
            <Skeleton key={`sk-${idx}`} variant="rounded" height={40} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (type === 'empty') {
    return (
      <Box
        sx={{ py: compact ? 2 : 5, px: 2, textAlign: 'center' }}
        role="status"
        aria-live="polite"
      >
        <Box sx={{ color: 'text.secondary', mb: 1.5 }}>
          {icon ?? <InboxOutlinedIcon fontSize="large" />}
        </Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {title ?? 'No hay resultados'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: actionLabel ? 2 : 0 }}>
          {description ?? 'No se encontraron registros para esta vista.'}
        </Typography>
        {actionLabel && onAction ? (
          <Button variant="outlined" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </Box>
    );
  }

  return (
    <Alert severity={type} sx={{ borderRadius: 3 }} role="status" aria-live="polite">
      <Typography variant="subtitle2">{title}</Typography>
      {description ? <Typography variant="body2">{description}</Typography> : null}
      {actionLabel && onAction ? (
        <Box sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={onAction}>
            {actionLabel}
          </Button>
        </Box>
      ) : null}
    </Alert>
  );
}
