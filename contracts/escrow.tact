// TON Escrow Smart Contract with 3% Commission
// This contract manages secure escrow transactions between two parties
// Automatically sends 3% commission to the platform wallet

import "@stdlib/deploy";

// Message to create a new escrow
message CreateEscrow {
    beneficiary: Address;      // Receiver's address
    deadline: Int as uint32;   // Deadline timestamp
}

// Message to release funds to beneficiary
message ReleaseEscrow {
    escrowId: Int as uint32;
}

// Message to refund to depositor
message RefundEscrow {
    escrowId: Int as uint32;
}

// Escrow data structure
struct EscrowData {
    depositor: Address;
    beneficiary: Address;
    amount: Int as coins;
    commission: Int as coins;
    deadline: Int as uint32;
    released: Bool;
    refunded: Bool;
}

contract EscrowContract with Deployable {
    owner: Address;                    // Platform owner
    commissionWallet: Address;         // Wallet for 3% commission
    escrowCounter: Int as uint32;      // Counter for escrows
    commissionPercent: Int as uint8;   // Commission percentage (3)

    // Storage for escrow data (in production, use a map)
    escrows: map<Int as uint32, EscrowData>;

    init(commissionWallet: Address) {
        self.owner = sender();
        self.commissionWallet = commissionWallet;
        self.escrowCounter = 0;
        self.commissionPercent = 3;  // 3% commission
        self.escrows = emptyMap();
    }

    // Create new escrow - receives TON with the message
    receive(msg: CreateEscrow) {
        let ctx: Context = context();
        let incomingAmount: Int = ctx.value;  // Amount sent with message

        require(incomingAmount > 0, "Amount must be greater than 0");
        require(msg.deadline > now(), "Deadline must be in future");

        // Calculate commission (3%)
        let commission: Int = (incomingAmount * self.commissionPercent) / 100;
        let beneficiaryAmount: Int = incomingAmount - commission;

        // Increment counter
        self.escrowCounter = self.escrowCounter + 1;

        // Store escrow data
        self.escrows.set(self.escrowCounter, EscrowData{
            depositor: ctx.sender,
            beneficiary: msg.beneficiary,
            amount: beneficiaryAmount,
            commission: commission,
            deadline: msg.deadline,
            released: false,
            refunded: false
        });

        // Send success message
        self.reply("Escrow created successfully".asComment());
    }

    // Release escrow to beneficiary
    receive(msg: ReleaseEscrow) {
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;
        let ctx: Context = context();

        // Only depositor or owner can release
        require(ctx.sender == escrowData.depositor || ctx.sender == self.owner, "Not authorized");
        require(!escrowData.released && !escrowData.refunded, "Already processed");

        // Mark as released
        escrowData.released = true;
        self.escrows.set(msg.escrowId, escrowData);

        // Send commission to platform wallet
        send(SendParameters{
            to: self.commissionWallet,
            value: escrowData.commission,
            mode: SendIgnoreErrors,
            body: "Commission payment".asComment()
        });

        // Send amount to beneficiary
        send(SendParameters{
            to: escrowData.beneficiary,
            value: escrowData.amount,
            mode: SendIgnoreErrors,
            body: "Escrow payment".asComment()
        });

        self.reply("Escrow released successfully".asComment());
    }

    // Refund escrow to depositor (after deadline)
    receive(msg: RefundEscrow) {
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;
        let ctx: Context = context();

        // Only depositor can refund after deadline
        require(ctx.sender == escrowData.depositor, "Not authorized");
        require(now() > escrowData.deadline, "Deadline not reached");
        require(!escrowData.released && !escrowData.refunded, "Already processed");

        // Mark as refunded
        escrowData.refunded = true;
        self.escrows.set(msg.escrowId, escrowData);

        // Refund full amount (including commission) to depositor
        let totalAmount: Int = escrowData.amount + escrowData.commission;
        send(SendParameters{
            to: escrowData.depositor,
            value: totalAmount,
            mode: SendIgnoreErrors,
            body: "Escrow refunded".asComment()
        });

        self.reply("Escrow refunded successfully".asComment());
    }

    // Get escrow count
    get fun escrowCount(): Int {
        return self.escrowCounter;
    }

    // Get escrow details
    get fun getEscrow(escrowId: Int): EscrowData? {
        return self.escrows.get(escrowId);
    }

    // Get commission percentage
    get fun getCommissionPercent(): Int {
        return self.commissionPercent;
    }

    // Get commission wallet
    get fun getCommissionWallet(): Address {
        return self.commissionWallet;
    }
}
