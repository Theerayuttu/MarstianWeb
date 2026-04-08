import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Accordion,
  AccordionSummary,
  Typography,
  Container,
  Button,
  Snackbar,
  Alert,
  Fab,
  Box, Dialog, DialogTitle, DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import { useRestriction } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import fetchOrThrow from '../common/util/fetchOrThrow';


const BlockDevicePage = () => {
  const navigate = useNavigate();
  const classes = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [statusText, setStatusText] = useState();

  const [confirmType, setConfirmType] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  
  const limitCommands = useRestriction('limitCommands');

  const handleBlock = (type) => {
    setConfirmType(type);
    setOpenConfirm(true);
  };

  const handleConfirm = async (type) => {
    const newItem = {type: type,attributes: {}, deviceId: parseInt(id, 10)};
    handleSend(newItem);
    setOpenConfirm(false);
  };

  const handleCancel = () => {
    setOpenConfirm(false);
  };

  const handleSend = useCatch(async (command) => {
    const response = await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });

    if (response.ok) {
      setStatusText(`${response.status} ${response.statusText} ${command.type} ${ response.status === 202 ? t('commandQueued') : t('commandSent') }`);
      setOpenSnackbar(true);
    } else {
      throw Error(await response.text());
    }
  });

  const deviceName = useSelector((state) => {
    if (id) {
      const device = state.devices.items[id];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceCommand']}>
      <Container maxWidth="xs" className={classes.container}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">
              {t('deviceBlockUsageMenu')}<br/>
              <strong>{deviceName}</strong>
            </Typography>
          </AccordionSummary>
          {!limitCommands && (
            <Box sx={{ '& > :not(style)': { m: 1 } }}>
              <Fab variant="extended" color='error' onClick={() => handleBlock("engineStop")}>
                <BlockIcon sx={{ mr: 1 }} />
                {t('commandBlock')}
              </Fab>
              <Fab variant="extended" color='success' onClick={() => handleBlock("engineResume")}>
                <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                {t('commandUnBlock')}
              </Fab>
            </Box>
          )}
        </Accordion>
        
        <div className={classes.buttons}>
          
          <Button
            type="button"
            color="primary"
            variant="outlined"
            onClick={() => navigate(-1)}
          >
            {t('sharedCancel')}
          </Button>
          <Snackbar
            open={openSnackbar}
            autoHideDuration={8000} 
            onClose={() => navigate(-1)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert onClose={() => navigate(-1)} severity="info">
              {statusText}
            </Alert>
          </Snackbar>

          <Dialog open={openConfirm} onClose={handleCancel}>
            <DialogTitle>{confirmType === "engineStop"? t('confirmBlock') : t('confirmUnBlock')}</DialogTitle>
            <DialogActions>
              <Button onClick={handleCancel}>{t('sharedCancel')}</Button>
              <Button onClick={() => handleConfirm(confirmType)} color={confirmType === "engineStop" ? "error" : "success"} variant="contained">
                {t('sharedYes')}
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </Container>
    </PageLayout>
  );
};

export default BlockDevicePage;
