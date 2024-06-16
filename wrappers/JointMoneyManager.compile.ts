import { CompilerConfig } from '@ton/blueprint';
import { cp, readdir } from 'fs/promises';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/joint_money_manager.tact',
    options: {
        debug: true,
        external: false,
    },
};
