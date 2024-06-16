import { Args, Config, Plugin, PluginRunner, RunnerContext, UIProvider } from '@ton/blueprint';
import { ScaffoldPlugin } from 'blueprint-scaffold';

export const config: Config = {
    plugins: [new ScaffoldPlugin()],
    network: {
        // WALLET_MNEMONIC="olive proud news announce ugly hundred original today shrug crunch crouch actress milk toy tenant session nerve convince apart stable month unknown hope reveal" WALLET_VERSION=v3r2 npx blueprint run deployJointMoney --custom http://127.0.0.1:34652/jsonRPC --mnemonic
        endpoint: 'http://127.0.0.1:34652/jsonRPC',
        type: 'custom',
    },
};
