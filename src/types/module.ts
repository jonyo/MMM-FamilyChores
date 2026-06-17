// MagicMirror Module Types - extending official @types/magicmirror-module

import type { Accessor } from 'solid-js';
import type { DayOfWeek, FamilyChoresData } from './chore-types';
import type { Config } from './config';

// Base MagicMirror module interface from official types
export interface MagicMirrorModule<TConfig = object> {
  name: string;
  config: TConfig;
  defaults: TConfig;
  file?: (filename: string) => string;
  getStyles: () => string[];
  getDom: () => HTMLElement;
  getHeader?: () => string;
  getTemplate?: () => string;
  getTemplateData?: () => object;
  getTranslations?: () => object;
  getScripts?: () => string[];
  start: () => void;
  suspend?: () => void;
  resume?: () => void;
  notificationReceived?: (notification: string, payload: unknown, sender: object) => void;
  socketNotificationReceived: (notification: string, payload: unknown) => void;
  sendSocketNotification?: (notification: string, payload: unknown) => void;
  updateDom?: () => void;
  nunjucksEnvironment?: () => void;
}

// Our specific module interface
export interface FamilyChoresModule extends Omit<MagicMirrorModule<Config>, 'getTranslations'> {
  name: 'MMM-FamilyChores';
  config: Config;
  defaults: Config;
  choreData: FamilyChoresData | null;

  // Override getTranslations to match MagicMirror's expected type
  getTranslations?: () => { [key: string]: string };

  // Per-instance Solid state — never shared across module instances
  choreDataSignal?: Accessor<FamilyChoresData | null>;
  todaysDayOfWeekSignal?: Accessor<DayOfWeek>;
  setChoreDataAndDay?: (data: FamilyChoresData) => void;
  rootContainer?: HTMLElement;

  // Custom methods specific to our module
  loadData: () => void;
  toggleChoreCompletion: (choreId: string, completed: boolean) => void;
}

// Module registration function type
export type ModuleRegisterFunction<TConfig = object> = (module: MagicMirrorModule<TConfig>) => void;
