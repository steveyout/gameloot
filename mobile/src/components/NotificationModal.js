import React from 'react';
import SwappableDrawerModal from './SwappableDrawerModal';

export default function NotificationModal(props) {
  return (
    <SwappableDrawerModal
      {...props}
      initialTab="notifications"
    />
  );
}
