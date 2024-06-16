import { Address, toNano } from '@ton/core';
import { JointMoneyManager } from '../wrappers/JointMoneyManager';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JointMoneyGroup } from '../wrappers/JointMoneyGroup';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('JointMoneyManager address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const jointMoneyManager = provider.open(JointMoneyManager.fromAddress(address));

    await jointMoneyManager.send(
        provider.sender(),
        {
            value: toNano('10'),
        },
        {
            $$type: 'CreateGroup',
            queryId: 0n,
        },
    );

    ui.write('Waiting for the group to be created...');

    const group = await JointMoneyGroup.fromInit(provider.sender().address!);

    await provider.waitForDeploy(group.address);

    ui.clearActionPrompt();
    ui.write('Group created at address: ' + group.address.toString());
}
