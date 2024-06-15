import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/joint_money_manager.tact',
    options: {
        debug: true,
        external: false,
    },
};
