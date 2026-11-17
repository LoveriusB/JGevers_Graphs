import { Box, Typography } from '@mui/material';

interface GraphPageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
}

export function GraphPageHeader({ title, description, eyebrow = 'EXPLORATEUR DE DONNÉES' }: GraphPageHeaderProps) {
  return (
    <Box>
      <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 2 }}>
        {eyebrow}
      </Typography>
      <Typography component="h1" variant="h4" sx={{ mt: 0.5 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 660 }}>
        {description}
      </Typography>
    </Box>
  );
}
