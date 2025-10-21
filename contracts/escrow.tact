// TON Escrow Smart Contract with 3% Commission
// This contract manages secure escrow transactions between two parties
// Automatically sends 3% commission to the platform wallet on each successful release

import "@stdlib/deploy";
import "@stdlib/ownable";

// ============================================
// MESSAGE DEFINITIONS
// ============================================

// Message to create a new escrow
message CreateEscrow {
    beneficiary: Address;      // Who will receive the funds
    deadline: Int as uint32;   // Unix timestamp for refund deadline
}

// Message to release funds to beneficiary (sender must be depositor)
message ReleaseEscrow {
    escrowId: Int as uint32;
}

// Message to refund to depositor (only after deadline)
message RefundEscrow {
    escrowId: Int as uint32;
}

// Message to cancel escrow before release (sender must be depositor)
message CancelEscrow {
    escrowId: Int as uint32;
}

// ============================================
// STRUCT DEFINITIONS
// ============================================

// Escrow data structure
struct EscrowData {
    id: Int as uint32;           // Unique escrow identifier
    depositor: Address;          // Who deposited the funds
    beneficiary: Address;        // Who receives the funds
    amount: Int as coins;        // Amount in nanoTON
    deadline: Int as uint32;     // Refund deadline (Unix timestamp)
    released: Bool;              // Whether funds were released
    refunded: Bool;              // Whether funds were refunded
    createdAt: Int as uint32;    // Creation timestamp
}

// ============================================
// MAIN CONTRACT
// ============================================

contract EscrowContract with Deployable, Ownable {

    // State variables
    owner: Address;                                    // Contract owner
    escrowCounter: Int as uint32 = 0;                 // Total escrows created
    commissionWallet: Address;                        // 3% commission receiver
    commissionRate: Int as uint8 = 3;                 // Commission percentage (3%)

    // Mapping to store escrow data (escrowId => EscrowData)
    escrows: map<Int as uint32, EscrowData>;

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        self.owner = sender();
        // Commission wallet (hardcoded as per requirements)
        // UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj
        self.commissionWallet = address("UQDXc5gs_-GAtRpKrcLDoSTMXaSxfxw1_R7xS_wdBdmrhkUj");
    }

    // ============================================
    // ESCROW CREATION
    // ============================================

    // Receive function to create new escrow
    // User sends TON along with this message
    receive(msg: CreateEscrow) {
        let ctx: Context = context();

        // Validation: ensure funds are sent
        require(ctx.value > 0, "Must send TON to create escrow");

        // Validation: ensure deadline is in the future
        require(msg.deadline > now(), "Deadline must be in future");

        // Validation: minimum amount (0.1 TON to cover fees)
        require(ctx.value >= ton("0.1"), "Minimum escrow amount is 0.1 TON");

        // Increment counter
        self.escrowCounter = self.escrowCounter + 1;
        let escrowId: Int = self.escrowCounter;

        // Calculate actual escrow amount (minus gas fees ~0.05 TON)
        let escrowAmount: Int = ctx.value - ton("0.05");

        // Create escrow data
        let escrow: EscrowData = EscrowData{
            id: escrowId,
            depositor: ctx.sender,
            beneficiary: msg.beneficiary,
            amount: escrowAmount,
            deadline: msg.deadline,
            released: false,
            refunded: false,
            createdAt: now()
        };

        // Store escrow
        self.escrows.set(escrowId, escrow);

        // Send confirmation back to depositor
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue,
            body: "Escrow created successfully".asComment()
        });
    }

    // ============================================
    // ESCROW RELEASE (WITH 3% COMMISSION)
    // ============================================

    // Release escrow funds to beneficiary
    // Only depositor can call this
    receive(msg: ReleaseEscrow) {
        let ctx: Context = context();

        // Get escrow data
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;

        // Validation: only depositor can release
        require(ctx.sender == escrowData.depositor, "Only depositor can release");

        // Validation: not already released or refunded
        require(!escrowData.released, "Already released");
        require(!escrowData.refunded, "Already refunded");

        // Calculate commission (3%)
        let commission: Int = (escrowData.amount * self.commissionRate) / 100;

        // Calculate beneficiary amount (97%)
        let beneficiaryAmount: Int = escrowData.amount - commission;

        // Update state BEFORE sending (prevent reentrancy)
        escrowData.released = true;
        self.escrows.set(msg.escrowId, escrowData);

        // Send 3% commission to platform wallet
        send(SendParameters{
            to: self.commissionWallet,
            value: commission,
            mode: SendPayGasSeparately,
            body: "Escrow commission".asComment()
        });

        // Send 97% to beneficiary
        send(SendParameters{
            to: escrowData.beneficiary,
            value: beneficiaryAmount,
            mode: SendPayGasSeparately,
            body: "Escrow payment".asComment()
        });

        // Notify depositor
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue,
            body: "Escrow released successfully".asComment()
        });
    }

    // ============================================
    // ESCROW REFUND
    // ============================================

    // Refund escrow to depositor (after deadline)
    receive(msg: RefundEscrow) {
        let ctx: Context = context();

        // Get escrow data
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;

        // Validation: deadline must have passed
        require(now() > escrowData.deadline, "Deadline not reached yet");

        // Validation: not already released or refunded
        require(!escrowData.released, "Already released");
        require(!escrowData.refunded, "Already refunded");

        // Validation: only depositor can refund
        require(ctx.sender == escrowData.depositor, "Only depositor can refund");

        // Update state BEFORE sending
        escrowData.refunded = true;
        self.escrows.set(msg.escrowId, escrowData);

        // Send full amount back to depositor (no commission on refunds)
        send(SendParameters{
            to: escrowData.depositor,
            value: escrowData.amount,
            mode: SendPayGasSeparately,
            body: "Escrow refunded".asComment()
        });

        // Notify sender
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue,
            body: "Refund processed".asComment()
        });
    }

    // ============================================
    // ESCROW CANCELLATION
    // ============================================

    // Cancel escrow before release (depositor only)
    receive(msg: CancelEscrow) {
        let ctx: Context = context();

        // Get escrow data
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;

        // Validation: only depositor can cancel
        require(ctx.sender == escrowData.depositor, "Only depositor can cancel");

        // Validation: not already released or refunded
        require(!escrowData.released, "Already released");
        require(!escrowData.refunded, "Already refunded");

        // Update state
        escrowData.refunded = true;
        self.escrows.set(msg.escrowId, escrowData);

        // Refund full amount (no commission on cancellations)
        send(SendParameters{
            to: escrowData.depositor,
            value: escrowData.amount,
            mode: SendPayGasSeparately,
            body: "Escrow cancelled and refunded".asComment()
        });

        // Notify
        send(SendParameters{
            to: ctx.sender,
            value: 0,
            mode: SendRemainingValue,
            body: "Escrow cancelled".asComment()
        });
    }

    // ============================================
    // GETTER FUNCTIONS
    // ============================================

    // Get total number of escrows created
    get fun escrowCount(): Int {
        return self.escrowCounter;
    }

    // Get escrow data by ID
    get fun getEscrow(escrowId: Int): EscrowData? {
        return self.escrows.get(escrowId);
    }

    // Get commission wallet address
    get fun getCommissionWallet(): Address {
        return self.commissionWallet;
    }

    // Get commission rate
    get fun getCommissionRate(): Int {
        return self.commissionRate;
    }

    // Get contract owner
    get fun getOwner(): Address {
        return self.owner;
    }

    // Check if escrow is active (not released and not refunded)
    get fun isEscrowActive(escrowId: Int): Bool {
        let escrow: EscrowData? = self.escrows.get(escrowId);
        if (escrow == null) {
            return false;
        }
        let escrowData: EscrowData = escrow!!;
        return !escrowData.released && !escrowData.refunded;
    }
}
