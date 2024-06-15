import "@stdlib/deploy";
import "./joint_money_group.tact";
message CreateGroup {
    queryId: Int as uint64;
}

contract JointMoneyManager with Deployable {
    groupCounter: Int as uint32;
    init(){
        self.groupCounter = 0;
    }

    receive(msg: CreateGroup){
        self.groupCounter += 1;
        let initialState: StateInit = initOf JointMoneyGroup(sender());
        let futureAddress: Address = contractAddress(initialState);
        send(SendParameters{
                bounce: true,
                to: futureAddress,
                value: ton("0"),
                mode: SendRemainingValue | SendBounceIfActionFail,
                body: Deploy{queryId: 0}.toCell(),
                code: initialState.code,
                data: initialState.data
            }
        );
        dump("Group created with address");
        dump(beginCell().storeAddress(futureAddress).endCell());
    }

    receive(msg: DeployOk){
        dump("Deployed child contract");
    }
}