// Escrow creation and management handler
import { Context, Markup } from 'telegraf';
import { i18n, Language } from '../utils/i18n';
import { DatabaseManager } from '../database/schema';
import { tonService } from '../services/ton.service';
import { parseAmount, formatDate } from '../utils/helpers';

interface SessionData {
  creatingEscrow?: boolean;
  escrowStep?: 'address' | 'amount';
  escrowData?: {
    receiverAddress?: string;
    amount?: number;
  };
}

export class EscrowHandler {
  private sessions: Map<number, SessionData> = new Map();

  constructor(private db: DatabaseManager) {}

  async startEscrowCreation(ctx: Context, lang: Language): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      // Initialize session
      this.sessions.set(telegramId, {
        creatingEscrow: true,
        escrowStep: 'address',
        escrowData: {}
      });

      const keyboard = Markup.keyboard([
        [i18n.t('btn_cancel', lang)]
      ]).resize();

      await ctx.reply(
        i18n.t('create_escrow_start', lang),
        keyboard
      );
    } catch (error) {
      console.error('Error starting escrow creation:', error);
      await ctx.reply(i18n.t('error_occurred', lang, { error: 'Failed to start' }));
    }
  }

  async handleEscrowInput(ctx: Context, lang: Language, input: string): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const session = this.sessions.get(telegramId);
      if (!session || !session.creatingEscrow) return;

      // Check for cancel
      if (input === i18n.t('btn_cancel', lang)) {
        await this.cancelEscrow(ctx, lang, telegramId);
        return;
      }

      if (session.escrowStep === 'address') {
        await this.handleAddressInput(ctx, lang, telegramId, input, session);
      } else if (session.escrowStep === 'amount') {
        await this.handleAmountInput(ctx, lang, telegramId, input, session);
      }
    } catch (error) {
      console.error('Error handling escrow input:', error);
      await ctx.reply(i18n.t('error_occurred', lang, { error: String(error) }));
    }
  }

  private async handleAddressInput(
    ctx: Context,
    lang: Language,
    telegramId: number,
    address: string,
    session: SessionData
  ): Promise<void> {
    // Validate address
    if (!tonService.isValidAddress(address)) {
      await ctx.reply(i18n.t('invalid_address', lang));
      return;
    }

    // Save address and move to amount step
    session.escrowData!.receiverAddress = address;
    session.escrowStep = 'amount';
    this.sessions.set(telegramId, session);

    await ctx.reply(
      i18n.t('enter_amount', lang, {
        address: tonService.shortenAddress(address)
      })
    );
  }

  private async handleAmountInput(
    ctx: Context,
    lang: Language,
    telegramId: number,
    input: string,
    session: SessionData
  ): Promise<void> {
    // Parse and validate amount
    const amount = parseAmount(input);

    if (!amount || amount <= 0) {
      await ctx.reply(i18n.t('invalid_amount', lang));
      return;
    }

    // Calculate amounts with commission
    const amounts = tonService.calculateAmounts(amount);

    // Save amount
    session.escrowData!.amount = amount;
    this.sessions.set(telegramId, session);

    // Show summary and payment button
    await this.showEscrowSummary(ctx, lang, session, amounts);
  }

  private async showEscrowSummary(
    ctx: Context,
    lang: Language,
    session: SessionData,
    amounts: any
  ): Promise<void> {
    const { receiverAddress, amount } = session.escrowData!;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url(
        i18n.t('btn_pay', lang),
        tonService.createTonkeeperUrl(
          receiverAddress!,
          amount!,
          `Escrow payment: ${amount} TON`
        )
      )],
      [Markup.button.callback(i18n.t('btn_cancel', lang), 'cancel_escrow')]
    ]);

    await ctx.reply(
      i18n.t('escrow_summary', lang, {
        receiver: tonService.shortenAddress(receiverAddress!),
        amount: tonService.formatAmount(amounts.originalAmount),
        commission: tonService.formatAmount(amounts.commission),
        total: tonService.formatAmount(amounts.totalAmount)
      }),
      keyboard
    );

    await ctx.reply(
      i18n.t('payment_link_created', lang, {
        amount: tonService.formatAmount(amounts.originalAmount),
        commission: tonService.formatAmount(amounts.commission),
        total: tonService.formatAmount(amounts.totalAmount)
      })
    );

    // Create escrow in database
    await this.createEscrowRecord(ctx, lang, session, amounts);
  }

  private async createEscrowRecord(
    ctx: Context,
    lang: Language,
    session: SessionData,
    amounts: any
  ): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const escrowId = tonService.generateEscrowId();
    const { receiverAddress, amount } = session.escrowData!;

    // Save to database
    const escrow = this.db.createEscrow({
      escrowId,
      creatorTelegramId: telegramId,
      receiverAddress: receiverAddress!,
      amount: amounts.originalAmount,
      commission: amounts.commission,
      totalAmount: amounts.totalAmount
    });

    // Clear session
    this.sessions.delete(telegramId);

    // Show success message
    await ctx.reply(
      i18n.t('escrow_created', lang, {
        escrowId,
        receiver: tonService.shortenAddress(receiverAddress!),
        amount: tonService.formatAmount(amount!),
        date: formatDate(new Date())
      })
    );
  }

  async showUserDeals(ctx: Context, lang: Language): Promise<void> {
    try {
      const telegramId = ctx.from?.id;
      if (!telegramId) return;

      const escrows = this.db.getUserEscrows(telegramId);

      if (escrows.length === 0) {
        await ctx.reply(i18n.t('no_deals', lang));
        return;
      }

      await ctx.reply(i18n.t('my_deals', lang, { count: escrows.length }));

      // Show each deal
      for (const escrow of escrows.slice(0, 10)) {
        const dealText = i18n.t('deal_item', lang, {
          id: escrow.escrow_id,
          amount: tonService.formatAmount(escrow.amount),
          status: i18n.t(`status_${escrow.status}`, lang),
          date: formatDate(escrow.created_at)
        });

        await ctx.reply(dealText);
      }
    } catch (error) {
      console.error('Error showing user deals:', error);
      await ctx.reply(i18n.t('error_occurred', lang, { error: String(error) }));
    }
  }

  private async cancelEscrow(ctx: Context, lang: Language, telegramId: number): Promise<void> {
    this.sessions.delete(telegramId);

    const keyboard = Markup.keyboard([
      [i18n.t('btn_create_escrow', lang)],
      [i18n.t('btn_my_deals', lang)],
      [i18n.t('btn_help', lang), i18n.t('btn_settings', lang)]
    ]).resize();

    await ctx.reply(i18n.t('operation_cancelled', lang), keyboard);
  }

  async handleCancelCallback(ctx: Context, lang: Language): Promise<void> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    await ctx.answerCbQuery();
    await this.cancelEscrow(ctx, lang, telegramId);
  }

  isCreatingEscrow(telegramId: number): boolean {
    return this.sessions.get(telegramId)?.creatingEscrow || false;
  }
}
