import { createQingmingEngine } from './engine';

const mount = document.getElementById('app') || document.body;
const handle = createQingmingEngine(mount);

(window as unknown as { __qingming?: typeof handle }).__qingming = handle;
