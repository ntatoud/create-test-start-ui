#!/usr/bin/env node

import { kernel } from '../index.js';

kernel
	.handle(['create-test-start-ui', ...process.argv.slice(2)])
	.catch(console.error);
