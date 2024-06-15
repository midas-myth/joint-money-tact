import "@stdlib/deploy";
struct GroupCreated {
    address: Address;
    admin: Address;
    balance: Int;
}

contract JointMoneyGroup with Deployable {
    admin: Address;
    init(admin: Address){
        dump("JointMoneyGroup deployed");
        self.admin = admin;
        emit(GroupCreated{
                //
                address: myAddress(),
                admin: admin,
                balance: myBalance()
            }.toCell()
        );
    }
}