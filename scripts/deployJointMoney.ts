import { toNano } from '@ton/core';
import { JointMoneyManager } from '../wrappers/JointMoneyManager';
import { NetworkProvider, compile } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    console.log('My address:', provider.sender().address?.toString());

    const jointMoney = provider.open(await JointMoneyManager.fromInit());

    await jointMoney.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );
    await provider.waitForDeploy(jointMoney.address);
    // console.log('Sent deploy');
}
