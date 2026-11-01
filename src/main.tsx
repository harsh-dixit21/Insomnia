import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './portal-app';
import { WorkspaceProvider } from './components/workspace/store';
import './portal-styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><MotionConfig reducedMotion="user"><WorkspaceProvider><App/></WorkspaceProvider></MotionConfig></React.StrictMode>);
