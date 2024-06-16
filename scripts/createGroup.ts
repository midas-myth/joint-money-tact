import { Address, toNano } from '@ton/core';
import { JointMoneyManager } from '../wrappers/JointMoneyManager';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { JointMoneyGroup } from '../wrappers/JointMoneyGroup';
import yargs from 'yargs/yargs';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const parser = await yargs(args)
        .option('address', {
            type: 'string',
            description: 'JointMoneyManager address',
        })
        .option('name', {
            type: 'string',
            description: 'Group name',
        })
        .parse();

    let addressStr = parser.address;
    let name = parser.name;

    if (!addressStr) {
        addressStr = await ui.input('JointMoneyManager address');
    }

    if (!name) {
        name = await ui.input('Group name');
    }

    const address = Address.parse(addressStr);

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
            name: name,
        },
    );

    ui.write('Waiting for the group to be created...');

    const group = await JointMoneyGroup.fromInit(provider.sender().address!, name);

    await provider.waitForDeploy(group.address);

    ui.clearActionPrompt();
    ui.write('Group created at address: ' + group.address.toString());
}
