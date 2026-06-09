import { Paper, PaperProps, Typography, Box } from '@mui/material';
import { ReactNode } from 'react';

interface DataSectionCardProps extends Omit<PaperProps, 'title'> {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function DataSectionCard({
  title,
  subtitle,
  actions,
  children,
  sx,
  ...paperProps
}: DataSectionCardProps) {
  return (
    <Paper sx={{ p: 2.5, ...sx }} {...paperProps}>
      {title || subtitle || actions ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            {title ? <Typography variant="h6">{title}</Typography> : null}
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {actions}
        </Box>
      ) : null}
      {children}
    </Paper>
  );
}
