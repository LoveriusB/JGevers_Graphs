import { useState } from 'react';
import { Box, Divider, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuOpenRounded from '@mui/icons-material/MenuOpenRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import { NavLink, Outlet } from 'react-router-dom';
import { graphRoutes } from '../navigation/graphRoutes';

export default function AppLayout() {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'));
  const width = expanded ? (isNarrow ? 220 : 256) : 72;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex' }}>
      <Box component="aside" sx={{ width, flexShrink: 0, transition: theme.transitions.create('width'), position: 'sticky', top: 0, height: '100dvh', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2, ...(isNarrow && expanded ? { position: 'fixed', left: 0, boxShadow: 4 } : {}) }}>
        <Box sx={{ height: 72, px: expanded ? 2 : 0, display: 'flex', alignItems: 'center', justifyContent: expanded ? 'space-between' : 'center', flexShrink: 0 }}>
          {expanded && <Typography variant="subtitle1" fontWeight={700} noWrap>Jacques Graphs</Typography>}
          <Tooltip title={expanded ? 'Réduire le menu' : 'Développer le menu'} placement="right">
            <IconButton aria-label={expanded ? 'Réduire le menu' : 'Développer le menu'} aria-expanded={expanded} aria-controls="graph-navigation" onClick={() => setExpanded(value => !value)}>
              {expanded ? <MenuOpenRounded /> : <MenuRounded />}
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />
        <List component="nav" id="graph-navigation" aria-label="Navigation des graphiques" sx={{ px: 1, py: 2, overflowY: 'auto' }}>
          {graphRoutes.map(({ path, label, icon: Icon }) => (
            <Tooltip key={path} title={expanded ? '' : label} placement="right">
              <ListItemButton component={NavLink} to={path} end aria-label={label} onClick={() => { if (isNarrow) setExpanded(false); }} sx={{ minHeight: 48, mb: 0.75, px: expanded ? 1.5 : 0, justifyContent: expanded ? 'flex-start' : 'center', borderRadius: 2, color: 'text.secondary', '&[aria-current="page"]': { bgcolor: 'action.selected', color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } } }}>
                <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 1.5 : 0, color: 'inherit' }}><Icon /></ListItemIcon>
                {expanded && <ListItemText primary={label} primaryTypographyProps={{ noWrap: true, fontSize: 14, fontWeight: 500 }} />}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Box>
      {isNarrow && expanded && <Box onClick={() => setExpanded(false)} aria-hidden="true" sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.25)', zIndex: 1 }} />}
      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 4 }, ...(isNarrow && expanded ? { ml: '72px' } : {}) }}><Outlet /></Box>
    </Box>
  );
}
