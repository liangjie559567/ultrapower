import { assertValidMode } from './src/lib/validateMode';
const validMode = assertValidMode(mode);
const path = `.omc/state/${validMode}-state.json`;
