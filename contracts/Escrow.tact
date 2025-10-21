// ======================================
// TON Escrow Smart Contract with 3% Fee
// ======================================
// This contract manages secure escrow transactions between buyers and sellers
// with an automatic 3% platform fee deducted from each transaction.

import "@stdlib/deploy";

// ==================
// Message Definitions
// ==================

// Message to create a new escrow
message CreateEscrow {
    seller: Address;           // Seller's wallet address
    amount: Int as coins;      // Total amount including fee (buyer pays)
    deadline: Int as uint32;   // Unix timestamp for refund deadline
    description: String;       // Escrow description/memo
}

// Message to fund an existing escrow
message FundEscrow {
    escrowId: Int as uint32;   // ID of the escrow to fund
}

// Message to release funds to seller
message ReleaseEscrow {
    escrowId: Int as uint32;   // ID of the escrow to release
}

// Message to refund funds to buyer
message RefundEscrow {
    escrowId: Int as uint32;   // ID of the escrow to refund
}

// ==================
// Data Structures
// ==================

// Stores all information about a single escrow transaction
struct EscrowData {
    id: Int as uint32;              // Unique escrow ID
    buyer: Address;                  // Buyer's wallet address
    seller: Address;                 // Seller's wallet address
    amount: Int as coins;            // Total amount deposited
    platformFee: Int as coins;       // 3% platform fee amount
    sellerAmount: Int as coins;      // Amount seller receives (97%)
    deadline: Int as uint32;         // Deadline for automatic refund
    description: String;             // Transaction description
    isFunded: Bool;                  // Whether funds are deposited
    isReleased: Bool;                // Whether funds released to seller
    isRefunded: Bool;                // Whether funds refunded to buyer
    createdAt: Int as uint32;        // Creation timestamp
}

// ==================
// Main Contract
// ==================

contract EscrowContract with Deployable {

    // Contract state variables
    owner: Address;                           // Platform owner (receives fees)
    escrowCounter: Int as uint32 = 0;        // Counter for escrow IDs

    // Storage for escrow data (maps ID to EscrowData)
    escrows: map<Int as uint32, EscrowData>;

    // Platform fee percentage (3% = 300 basis points)
    const PLATFORM_FEE_PERCENT: Int = 3;
    const FEE_DENOMINATOR: Int = 100;

    // Minimum escrow amount (0.1 TON)
    const MIN_ESCROW_AMOUNT: Int = ton("0.1");

    // Gas fees reserve
    const GAS_RESERVE: Int = ton("0.05");

    // ==================
    // Initialization
    // ==================

    init() {
        self.owner = sender();
        self.escrowCounter = 0;
    }

    // ==================
    // Core Functions
    // ==================

    /**
     * CREATE ESCROW
     * Creates a new escrow transaction record
     * Buyer must call this first before funding
     */
    receive(msg: CreateEscrow) {
        let ctx: Context = context();

        // Validation checks
        require(msg.amount >= self.MIN_ESCROW_AMOUNT, "Amount must be at least 0.1 TON");
        require(msg.deadline > now(), "Deadline must be in future");
        require(msg.seller != ctx.sender, "Buyer and seller cannot be same");

        // Calculate fees and amounts
        let platformFee: Int = (msg.amount * self.PLATFORM_FEE_PERCENT) / self.FEE_DENOMINATOR;
        let sellerAmount: Int = msg.amount - platformFee;

        // Increment counter
        self.escrowCounter = self.escrowCounter + 1;

        // Create new escrow record
        let newEscrow: EscrowData = EscrowData{
            id: self.escrowCounter,
            buyer: ctx.sender,
            seller: msg.seller,
            amount: msg.amount,
            platformFee: platformFee,
            sellerAmount: sellerAmount,
            deadline: msg.deadline,
            description: msg.description,
            isFunded: false,
            isReleased: false,
            isRefunded: false,
            createdAt: now()
        };

        // Store escrow data on-chain
        self.escrows.set(self.escrowCounter, newEscrow);

        // Send confirmation reply
        self.reply("Escrow created successfully. Please fund it.".asComment());
    }

    /**
     * FUND ESCROW
     * Buyer deposits funds into the escrow
     * Must send exact amount specified during creation
     */
    receive(msg: FundEscrow) {
        let ctx: Context = context();
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);

        // Validation checks
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;

        require(escrowData.buyer == ctx.sender, "Only buyer can fund this escrow");
        require(!escrowData.isFunded, "Escrow already funded");
        require(!escrowData.isReleased, "Escrow already released");
        require(!escrowData.isRefunded, "Escrow already refunded");
        require(ctx.value >= escrowData.amount + self.GAS_RESERVE, "Insufficient funds sent");
        require(now() <= escrowData.deadline, "Escrow deadline passed");

        // Mark as funded
        escrowData.isFunded = true;

        // Update escrow data
        self.escrows.set(msg.escrowId, escrowData);

        // Send confirmation
        self.reply("Escrow funded successfully".asComment());
    }

    /**
     * RELEASE ESCROW
     * Releases funds to seller and platform fee to owner
     * Can only be called by buyer after funding
     */
    receive(msg: ReleaseEscrow) {
        let ctx: Context = context();
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);

        // Validation checks
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;

        require(escrowData.buyer == ctx.sender, "Only buyer can release escrow");
        require(escrowData.isFunded, "Escrow not funded yet");
        require(!escrowData.isReleased, "Escrow already released");
        require(!escrowData.isRefunded, "Escrow already refunded");

        // Mark as released
        escrowData.isReleased = true;

        // Update escrow data
        self.escrows.set(msg.escrowId, escrowData);

        // Transfer seller amount to seller (97% of total)
        send(SendParameters{
            to: escrowData.seller,
            value: escrowData.sellerAmount,
            mode: SendPayGasSeparately,
            body: "Escrow payment released".asComment()
        });

        // Transfer platform fee to owner (3% of total)
        send(SendParameters{
            to: self.owner,
            value: escrowData.platformFee,
            mode: SendPayGasSeparately,
            body: "Platform fee from escrow".asComment()
        });

        // Send confirmation
        self.reply("Escrow released successfully".asComment());
    }

    /**
     * REFUND ESCROW
     * Refunds full amount back to buyer
     * Can be called by buyer if deadline passed or by mutual agreement
     */
    receive(msg: RefundEscrow) {
        let ctx: Context = context();
        let escrow: EscrowData? = self.escrows.get(msg.escrowId);

        // Validation checks
        require(escrow != null, "Escrow not found");

        let escrowData: EscrowData = escrow!!;

        require(escrowData.buyer == ctx.sender || escrowData.seller == ctx.sender,
                "Only buyer or seller can refund");
        require(escrowData.isFunded, "Escrow not funded yet");
        require(!escrowData.isReleased, "Escrow already released");
        require(!escrowData.isRefunded, "Escrow already refunded");

        // Can refund if deadline passed OR both parties agree
        let canRefund: Bool = now() > escrowData.deadline || ctx.sender == escrowData.buyer;
        require(canRefund, "Cannot refund before deadline");

        // Mark as refunded
        escrowData.isRefunded = true;

        // Update escrow data
        self.escrows.set(msg.escrowId, escrowData);

        // Refund full amount to buyer (100%, no fee charged on refund)
        send(SendParameters{
            to: escrowData.buyer,
            value: escrowData.amount,
            mode: SendPayGasSeparately,
            body: "Escrow refunded".asComment()
        });

        // Send confirmation
        self.reply("Escrow refunded successfully".asComment());
    }

    // ==================
    // Getter Functions
    // ==================

    /**
     * Get total number of escrows created
     */
    get fun escrowCount(): Int {
        return self.escrowCounter;
    }

    /**
     * Get details of a specific escrow by ID
     */
    get fun getEscrow(escrowId: Int): EscrowData? {
        return self.escrows.get(escrowId);
    }

    /**
     * Get contract owner address
     */
    get fun owner(): Address {
        return self.owner;
    }

    /**
     * Get platform fee percentage
     */
    get fun platformFeePercent(): Int {
        return self.PLATFORM_FEE_PERCENT;
    }

    /**
     * Calculate fee for a given amount
     */
    get fun calculateFee(amount: Int): Int {
        return (amount * self.PLATFORM_FEE_PERCENT) / self.FEE_DENOMINATOR;
    }

    /**
     * Get contract balance
     */
    get fun balance(): Int {
        return myBalance();
    }
}
