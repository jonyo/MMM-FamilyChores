import type { Config } from '../types/config';
import { Frontend } from './frontend';

// Register the module with MagicMirror
Module.register<Config>('MMM-FamilyChores', Frontend);
