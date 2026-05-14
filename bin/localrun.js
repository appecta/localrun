#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from '../src/App.jsx';

// Clear screen and move cursor to top before ink takes over
process.stdout.write('\x1b[2J\x1b[H');

render(React.createElement(App), { exitOnCtrlC: true });
