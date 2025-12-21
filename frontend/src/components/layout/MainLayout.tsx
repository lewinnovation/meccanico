import React, { useState, useEffect } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, IconButton, Button, useTheme } from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon, Add as AddIcon, People } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../stores/RootStore';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../common/CommandPalette';
import { ProfileDialog } from '../profile/ProfileDialog';

const SIDEBAR_WIDTH = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = observer(({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { uiStore } = useStore();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    const handleOpenProfile = () => {
      setProfileDialogOpen(true);
    };

    window.addEventListener('openProfile', handleOpenProfile);
    return () => {
      window.removeEventListener('openProfile', handleOpenProfile);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: uiStore.sidebarOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
          ml: uiStore.sidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={() => uiStore.toggleSidebar()}
              edge="start"
              sx={{ color: 'text.secondary' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, justifyContent: 'center', maxWidth: 600 }}>
            <Box
              onClick={() => uiStore.toggleCommandPalette()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
                bgcolor: 'grey.100',
                borderRadius: 1,
                cursor: 'pointer',
                flex: 1,
                '&:hover': { bgcolor: 'grey.200' },
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                Search...
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  ml: 2,
                  px: 1,
                  py: 0.25,
                  bgcolor: 'grey.200',
                  borderRadius: 0.5,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                }}
              >
                ⌘K
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => navigate('/jobs/new')}
              sx={{ minWidth: 'auto', px: 1.5 }}
            >
              New Job
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<People />}
              onClick={() => navigate('/customers')}
              sx={{ minWidth: 'auto', px: 1.5 }}
            >
              New Customer
            </Button>
          </Box>

          <Box sx={{ width: 48 }} /> {/* Spacer for balance */}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={uiStore.sidebarOpen}
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: uiStore.sidebarOpen ? 0 : `-${SIDEBAR_WIDTH}px`,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>

      {/* Command Palette */}
      <CommandPalette />

      {/* Profile Dialog */}
      <ProfileDialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} />
    </Box>
  );
});

