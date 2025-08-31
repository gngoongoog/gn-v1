import React from 'react';
import { createRoot } from 'react-dom/client';
import GnStore from './GnStore';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<GnStore />);
