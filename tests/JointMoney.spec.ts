import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { JointMoneyManager, loadGroupCreated } from '../wrappers/JointMoney';
import '@ton/test-utils';

describe('JointMoney', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jointMoneyManager: SandboxContract<JointMoneyManager>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        jointMoneyManager = blockchain.openContract(await JointMoneyManager.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jointMoneyManager.address,
            deploy: true,

            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and simpleCounter are ready to use
    });

    it('just do something', async () => {
        const res = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'CreateGroup',
                queryId: 1n,
            },
        );

        const valid = res.externals
            .map((e) => {
                try {
                    const newGroup = loadGroupCreated(e.body.beginParse());
                    return newGroup;
                } catch (error) {
                    return null;
                }
            })
            .filter((e) => e !== null)
            .at(0);

        console.log(valid);
    });
});
