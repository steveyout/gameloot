import React from 'react';
import SwappableDrawerModal from './SwappableDrawerModal';

export default function SettingsModal(props) {
  return (
    <SwappableDrawerModal
      {...props}
      initialTab="settings"
    />
  );
}
