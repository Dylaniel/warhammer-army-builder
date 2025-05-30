import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Warhammer Army Builder
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            Home
          </Button>
          <Button color="inherit" component={RouterLink} to="/army-builder">
            Army Builder
          </Button>
          <Button color="inherit" component={RouterLink} to="/units">
            Units
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 