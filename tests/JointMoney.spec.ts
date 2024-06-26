import '@ton/test-utils';

import { Slice, toNano } from '@ton/core';
import { Blockchain, EventMessageSent, ExternalOut, SandboxContract, TreasuryContract } from '@ton/sandbox';

import { JointMoneyGroup } from '../wrappers/JointMoneyGroup';
import {
    JointMoneyManager,
    loadGroupCreated,
    loadMemberAccepted,
    loadMemberInvited,
} from '../wrappers/JointMoneyManager';

function loadApplicableMessage<T>(externals: ExternalOut[], loader: (data: Slice) => T): T | undefined {
    return (
        externals
            .map((e) => {
                try {
                    const newGroup = loader(e.body.beginParse());
                    return newGroup;
                } catch (error) {
                    return null;
                }
            })
            .filter((e) => e !== null)
            .at(0) || undefined
    );
}

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

    it('should create group', async () => {
        const res = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'CreateGroup',
                queryId: 1n,
                name: 'Test Group',
            },
        );

        const groupCreatedMessage = loadApplicableMessage(res.externals, loadGroupCreated);

        expect(groupCreatedMessage).not.toBeUndefined();

        const groupInstance = blockchain.openContract(JointMoneyGroup.fromAddress(groupCreatedMessage!.address));

        const groupState = await groupInstance.getState();

        expect(groupState.admin.equals(deployer.address)).toBe(true);
        expect(groupState.membersCount).toBe(1n);
        expect(groupState.invitesCount).toBe(0n);
        expect(groupState.members.size).toBe(1);
        expect(groupState.members.has(deployer.address)).toBe(true);
        expect(groupState.invites.size).toBe(0);
        expect(groupState.balance).toBeGreaterThan(0n);
    });

    it('should invite user', async () => {
        const someOtherUser = await blockchain.treasury('someOtherUser');

        const res = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'CreateGroup',
                queryId: 0n,
                name: 'Test Group',
            },
        );

        const groupCreatedMessage = loadApplicableMessage(res.externals, loadGroupCreated);

        expect(groupCreatedMessage).not.toBeUndefined();

        const groupInstance = blockchain.openContract(JointMoneyGroup.fromAddress(groupCreatedMessage!.address));

        const inviteResult = await groupInstance.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'InviteMember',
                address: someOtherUser.address,
            },
        );

        const groupState = await groupInstance.getState();

        expect(groupState.invitesCount).toBe(1n);
        expect(groupState.invites.has(someOtherUser.address)).toBe(true);

        const invitedMessage = loadApplicableMessage(inviteResult.externals, loadMemberInvited);

        expect(invitedMessage).not.toBeUndefined();

        expect(invitedMessage!.invitee.equals(someOtherUser.address)).toBe(true);
    });

    it('should accept invite', async () => {
        const someOtherUser = await blockchain.treasury('someOtherUser');

        const res = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'CreateGroup',
                queryId: 0n,
                name: 'Test Group',
            },
        );

        const groupCreatedMessage = loadApplicableMessage(res.externals, loadGroupCreated);

        expect(groupCreatedMessage).not.toBeUndefined();

        const groupInstance = blockchain.openContract(JointMoneyGroup.fromAddress(groupCreatedMessage!.address));

        const inviteResult = await groupInstance.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'InviteMember',
                address: someOtherUser.address,
            },
        );

        const invitedMessage = loadApplicableMessage(inviteResult.externals, loadMemberInvited);

        expect(invitedMessage).not.toBeUndefined();

        const invitedUser = blockchain.openContract(JointMoneyGroup.fromAddress(groupCreatedMessage!.address));

        const acceptResult = await invitedUser.send(
            someOtherUser.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'AcceptInvite',
            },
        );

        const acceptedMessage = loadApplicableMessage(acceptResult.externals, loadMemberAccepted);

        expect(acceptedMessage).not.toBeUndefined();

        const groupState = await groupInstance.getState();

        expect(groupState.membersCount).toBe(2n);
        expect(groupState.members.has(someOtherUser.address)).toBe(true);
        expect(groupState.invites.has(someOtherUser.address)).toBe(false);
        expect(groupState.invitesCount).toBe(0n);
        expect(groupState.invites.size).toBe(0);
    });

    it("shouldn't accept invite if not invited", async () => {
        const someOtherUser = await blockchain.treasury('someOtherUser');

        const res = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'CreateGroup',
                queryId: 1n,
                name: 'Test Group',
            },
        );

        const groupCreatedMessage = loadApplicableMessage(res.externals, loadGroupCreated);

        expect(groupCreatedMessage).not.toBeUndefined();

        console.log('other user address', someOtherUser.address.toString());
        console.log('group address', groupCreatedMessage!.address.toString());

        const groupInstance = blockchain.openContract(JointMoneyGroup.fromAddress(groupCreatedMessage!.address));

        const acceptResult = await groupInstance.send(
            someOtherUser.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'AcceptInvite',
            },
        );

        const errorEvent = acceptResult.events.find(
            (e) => e.type === 'message_sent' && e.bounced === true,
        ) as EventMessageSent;

        expect(errorEvent).not.toBeUndefined();
    });

    it('should withdraw', async () => {
        const receiver = await blockchain.treasury('receiver', { balance: toNano('0.01') });

        const res = await jointMoneyManager.send(
            deployer.getSender(),
            {
                value: toNano('100'),
            },
            {
                $$type: 'CreateGroup',
                queryId: 1n,
                name: 'Test Group',
            },
        );

        const groupCreatedMessage = loadApplicableMessage(res.externals, loadGroupCreated);
        expect(groupCreatedMessage).not.toBeUndefined();

        const groupInstance = blockchain.openContract(JointMoneyGroup.fromAddress(groupCreatedMessage!.address));

        const withdrawResult = await groupInstance.send(
            deployer.getSender(),
            {
                value: toNano('0.01'),
            },
            {
                $$type: 'Withdraw',
                to: receiver.address,
                amount: toNano('10'),
            },
        );

        const groupState = await groupInstance.getState();
        expect(groupState.balance).toBeGreaterThan(0n);
        expect(groupState.balance).toBeLessThan(toNano('90'));

        expect(await receiver.getBalance()).toBeGreaterThan(toNano('5'));
    });
});
