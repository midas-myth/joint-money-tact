import "@stdlib/deploy";
message InviteMember {
    address: Address;
}
message AcceptInvite {
}
message GroupCreated {
    address: Address;
    admin: Address;
    balance: Int as coins;
}
message MemberInvited {
    invitee: Address;
}
message MemberAccepted {
    member: Address;
}
message Deposit {
}
message GroupView {
    admin: Address;
    members: map<Address, Bool>;
    invites: map<Address, Bool>;
    membersCount: Int as uint8;
    invitesCount: Int as uint8;
    balance: Int as coins;
}
message Deposited {
    newBalance: Int as coins;
}
message Withdraw {
    to: Address;
    amount: Int as coins;
}
message Withdrawn {
    newBalance: Int as coins;
}
const MAX_MEMBERS: Int = 10;
const MAX_INVITES: Int = 10;

contract JointMoneyGroup with Deployable {
    admin: Address;
    name: String;
    members: map<Address, Bool>;
    invites: map<Address, Bool>;
    membersCount: Int as uint8;
    invitesCount: Int as uint8;
    init(admin: Address, name: String){
        dump("JointMoneyGroup deployed");
        self.admin = admin;
        self.name = name;
        self.members = emptyMap();
        self.members.set(admin, true);
        self.membersCount = 1;
        self.invites = emptyMap();
        self.invitesCount = 0;
        emit(GroupCreated{address: myAddress(), admin: admin, balance: myBalance()}.toCell());
    }

    receive(msg: InviteMember){
        require(self.admin == sender(), "Only admin can invite members");
        require(self.invitesCount < MAX_INVITES, "Max invites reached");
        self.invites.set(msg.address, true);
        self.invitesCount += 1;
        emit(MemberInvited{invitee: msg.address}.toCell());
    }

    receive(msg: AcceptInvite){
        // prettier-ignore
        let invite: Bool? = self.invites.get(sender());

        require(invite != null, "No invite found");
        require(self.membersCount < MAX_MEMBERS, "Max members reached");
        self.members.set(sender(), true);
        self.membersCount += 1;
        self.invites.del(sender());
        self.invitesCount -= 1;
        emit(MemberAccepted{member: sender()}.toCell());
    }

    receive(msg: Deposit){
        require(self.members.get(sender()) != null, "hello");
        emit(Deposited{newBalance: myBalance()}.toCell());
    }

    receive(msg: Withdraw){
        require(self.members.get(sender()) != null, "Only members can withdraw");
        require(myBalance() >= msg.amount, "Insufficient balance");
        send(SendParameters{
                //
                to: msg.to,
                value: msg.amount,
                mode: SendPayGasSeparately
            }
        );
        let estimatedNewBalance: Int = (myBalance() - msg.amount);
        emit(Withdrawn{newBalance: estimatedNewBalance}.toCell());
    }

    get fun state(): GroupView {
        return
            GroupView{
                admin: self.admin,
                members: self.members,
                invites: self.invites,
                membersCount: self.membersCount,
                invitesCount: self.invitesCount,
                balance: myBalance()
            };
    }
}