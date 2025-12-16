import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Store as ShopIcon,
  Receipt as TaxIcon,
  Description as InvoiceIcon,
  AttachMoney as CurrencyIcon,
  Translate as LanguageIcon,
  People as UsersIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/RootStore';

const SettingsMenu: React.FC = observer(() => {
  const { authStore } = useStore();

  const settingsItems = [
    { icon: ShopIcon, label: 'Shop Information', description: 'Name, address, contact details' },
    { icon: TaxIcon, label: 'Tax Settings', description: 'Tax rates and configuration' },
    { icon: InvoiceIcon, label: 'Invoice Templates', description: 'Customize invoice appearance' },
    { icon: CurrencyIcon, label: 'Currency', description: 'Currency and formatting' },
    { icon: LanguageIcon, label: 'Language', description: 'Interface language' },
  ];

  const adminItems = [
    { icon: UsersIcon, label: 'User Management', description: 'Manage mechanics and access' },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <List disablePadding>
            {settingsItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton sx={{ py: 2 }}>
                    <ListItemIcon>
                      <item.icon />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                    />
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {authStore.isAdmin && (
        <>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Administration
          </Typography>
          <Card>
            <CardContent sx={{ p: 0 }}>
              <List disablePadding>
                {adminItems.map((item, index) => (
                  <React.Fragment key={item.label}>
                    {index > 0 && <Divider />}
                    <ListItem disablePadding>
                      <ListItemButton sx={{ py: 2 }}>
                        <ListItemIcon>
                          <item.icon />
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          secondary={item.description}
                        />
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
});

export const Settings: React.FC = () => (
  <Routes>
    <Route path="/*" element={<SettingsMenu />} />
  </Routes>
);

